import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { StorageSlot, StorageSlotStatus, SlotType } from './entities/storage-slot.entity';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';
import { AssignOrderDto } from './dto/assign-order.dto';
import { OrderStorage } from './entities/order-storage.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { Client } from '../clients/entities/client.entity';
import { ArticleType } from '../catalog/entities/article-type.entity';
import { ServiceDefinition } from '../catalog/entities/service-definition.entity';
import { RlsService } from '../shared/database/rls/rls.service';
import { OrderLookupResponse } from './dto/order-lookup.response';
import { SlotContentsResponse } from './dto/slot-contents.response';
import {
    isFullUuid,
    isUuidPrefix,
    normalizeReferenceQuery,
} from '../orders/utils/order-reference.util';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface OrderStorageInfo {
    slot_label: string | null;
    slot_type: SlotType | null;
    slot_id: string | null;
}

export interface StorageOrderLookupResult {
    count: number;
    matches: OrderLookupResponse[];
}

@Injectable()
export class StorageService {
    constructor(
        @InjectRepository(StorageSlot)
        private readonly storageSlotRepository: Repository<StorageSlot>,
        private readonly rls: RlsService,
    ) { }

    async create(createStorageSlotDto: CreateStorageSlotDto): Promise<StorageSlot> {
        return this.rls.wrapTransaction(async (manager) => {
            const slot = manager.create(StorageSlot, createStorageSlotDto);
            const tenantId = this.rls.getTenantId();
            if (tenantId) {
                slot.tenant_id = tenantId;
            }

            try {
                return await manager.save(StorageSlot, slot);
            } catch (error: any) {
                if (error.code === '23505') {
                    throw new ConflictException('Slot with this name already exists in this site.');
                }
                throw error;
            }
        });
    }

    async findAll(siteId: string, slotType?: SlotType): Promise<StorageSlot[]> {
        return this.rls.wrapTransaction(async (manager) => {
            const where: Record<string, string> = { site_id: siteId };
            if (slotType) {
                where.slot_type = slotType;
            }
            return manager.find(StorageSlot, { where });
        });
    }

    /**
     * Occupancy rate per site for the current tenant (RLS-scoped).
     */
    async getOccupancyBySite(): Promise<
        Array<{ siteId: string; total: number; occupied: number; rate: number }>
    > {
        return this.rls.wrapTransaction(async (manager) => {
            const tenantId = this.rls.getTenantId();
            if (!tenantId) {
                return [];
            }

            const rows = await manager
                .createQueryBuilder(StorageSlot, 'slot')
                .select('slot.site_id', 'siteId')
                .addSelect('COUNT(*)', 'total')
                .addSelect(
                    `SUM(CASE WHEN slot.status = :occupied THEN 1 ELSE 0 END)`,
                    'occupied',
                )
                .where('slot.tenant_id = :tenantId', { tenantId })
                .setParameter('occupied', StorageSlotStatus.OCCUPIED)
                .groupBy('slot.site_id')
                .getRawMany();

            return rows.map((row) => {
                const total = parseInt(row.total, 10) || 0;
                const occupied = parseInt(row.occupied, 10) || 0;
                return {
                    siteId: String(row.siteId),
                    total,
                    occupied,
                    rate: total > 0 ? Math.round((occupied / total) * 100) : 0,
                };
            });
        });
    }

    async getOrderStorageInfo(orderId: string): Promise<OrderStorageInfo> {
        return this.rls.wrapTransaction(async (manager) => {
            const assignment = await manager.findOne(OrderStorage, {
                where: { order_id: orderId },
                relations: ['shelf_slot'],
            });

            if (!assignment?.shelf_slot) {
                return { slot_label: null, slot_type: null, slot_id: null };
            }

            return {
                slot_label: assignment.shelf_slot.name,
                slot_type: assignment.shelf_slot.slot_type,
                slot_id: assignment.shelf_slot.id,
            };
        });
    }

    /**
     * Reverse lookup: what's currently stored in this slot.
     * Returns order reference, client name, and enriched line items.
     */
    async getSlotContents(slotId: string): Promise<SlotContentsResponse> {
        return this.rls.wrapTransaction(async (manager) => {
            const slot = await manager.findOne(StorageSlot, { where: { id: slotId } });
            if (!slot) {
                throw new NotFoundException('Storage slot not found');
            }

            const slotDto = {
                id: slot.id,
                name: slot.name,
                status: slot.status,
                slot_type: slot.slot_type,
            };

            const assignment = await manager.findOne(OrderStorage, {
                where: { shelf_slot_id: slotId },
                relations: ['order', 'order.items'],
            });

            if (!assignment?.order) {
                return { slot: slotDto, order: null };
            }

            const order = assignment.order;
            const client = await manager.findOne(Client, { where: { id: order.client_id } });
            const itemsByOrderId = await this.enrichOrderItems(manager, [order]);
            const enrichedItems = itemsByOrderId.get(order.id) ?? [];

            const clientName = client
                ? `${client.first_name} ${client.last_name}`.trim() ||
                  client.unique_code ||
                  client.phone ||
                  'Client inconnu'
                : 'Client inconnu';

            return {
                slot: slotDto,
                order: {
                    id: order.id,
                    reference: order.reference ?? null,
                    status: order.status,
                    client_name: clientName,
                    client_phone: client?.phone ?? null,
                    items: enrichedItems.map((item) => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: Number(item.price),
                        article_label: item.article_label,
                        service_label: item.service_label,
                    })),
                },
            };
        });
    }

    async assignOrderToSlot(dto: AssignOrderDto): Promise<void> {
        return this.rls.wrapTransaction(async (manager) => {
            const order = await manager.findOne(Order, { where: { id: dto.order_id } });
            if (!order) {
                throw new NotFoundException('Order not found');
            }

            const existingAssignments = await manager.find(OrderStorage, {
                where: { order_id: dto.order_id },
                relations: ['shelf_slot'],
            });

            const alreadyOnTarget = existingAssignments.find(
                (a) => a.shelf_slot_id === dto.shelf_slot_id,
            );
            if (alreadyOnTarget) {
                return;
            }

            // Enforce one active slot per order — free any previous locations first
            for (const previous of existingAssignments) {
                if (previous.shelf_slot) {
                    previous.shelf_slot.status = StorageSlotStatus.FREE;
                    await manager.save(StorageSlot, previous.shelf_slot);
                }
                await manager.remove(OrderStorage, previous);
            }

            const slot = await manager.findOne(StorageSlot, { where: { id: dto.shelf_slot_id } });
            if (!slot) {
                throw new NotFoundException('Storage slot not found');
            }

            if (slot.status !== StorageSlotStatus.FREE) {
                throw new ConflictException('Storage slot is not FREE');
            }

            // Validate order status ↔ slot type pairing
            if (order.status === OrderStatus.CREATED) {
                if (slot.slot_type !== SlotType.RECEPTION) {
                    throw new BadRequestException(
                        `Le rayon ${slot.name} est un rayon de livraison. Une commande créée doit être rangée en réception (ex. A-01).`,
                    );
                }
            } else if (order.status === OrderStatus.READY) {
                if (slot.slot_type !== SlotType.DELIVERY) {
                    throw new BadRequestException(
                        `Le rayon ${slot.name} est un rayon de réception. Une commande prête doit être rangée en livraison (ex. B-01).`,
                    );
                }
            } else if (order.status === OrderStatus.STORED) {
                if (slot.slot_type !== SlotType.DELIVERY) {
                    throw new BadRequestException(
                        `Le rayon ${slot.name} n'est pas un rayon de livraison.`,
                    );
                }
            } else {
                throw new BadRequestException(
                    `Impossible de ranger une commande au statut ${order.status}. ` +
                    (order.status === OrderStatus.IN_PROGRESS
                        ? 'Marquez-la d\'abord comme prête.'
                        : 'Vérifiez le workflow de la commande.'),
                );
            }

            const assignment = manager.create(OrderStorage, {
                order_id: dto.order_id,
                shelf_slot_id: dto.shelf_slot_id,
            });

            const tenantId = this.rls.getTenantId();
            if (tenantId) {
                assignment.tenant_id = tenantId;
            }

            await manager.save(OrderStorage, assignment);

            if (order.status === OrderStatus.READY) {
                order.status = OrderStatus.STORED;
                await manager.save(Order, order);
            }

            slot.status = StorageSlotStatus.OCCUPIED;
            await manager.save(StorageSlot, slot);
        });
    }

    async releaseOrder(orderId: string): Promise<OrderStorageInfo> {
        return this.rls.wrapTransaction(async (manager) => {
            const assignments = await manager.find(OrderStorage, {
                where: { order_id: orderId },
                relations: ['shelf_slot'],
            });

            if (assignments.length === 0) {
                throw new BadRequestException('Order is not currently stored in any slot');
            }

            const primary = assignments[0];
            const slotInfo: OrderStorageInfo = {
                slot_label: primary.shelf_slot?.name ?? null,
                slot_type: primary.shelf_slot?.slot_type ?? null,
                slot_id: primary.shelf_slot?.id ?? null,
            };

            for (const assignment of assignments) {
                if (assignment.shelf_slot) {
                    assignment.shelf_slot.status = StorageSlotStatus.FREE;
                    await manager.save(StorageSlot, assignment.shelf_slot);
                }
            }

            await manager.remove(OrderStorage, assignments);

            return slotInfo;
        });
    }

    async lookupOrder(orderId: string): Promise<OrderLookupResponse> {
        const result = await this.lookupOrders(orderId);
        if (result.count === 0) {
            throw new NotFoundException('Order not found');
        }
        if (result.count > 1) {
            throw new BadRequestException(
                'Multiple orders match this query. Use GET /storage/lookup?q= for disambiguation.',
            );
        }
        return result.matches[0];
    }

    async lookupOrders(
        query: string,
        options: { siteId?: string; statuses?: OrderStatus[]; limit?: number } = {},
    ): Promise<StorageOrderLookupResult> {
        return this.rls.wrapTransaction(async (manager) => {
            const trimmed = query.trim();
            if (!trimmed) {
                throw new BadRequestException('Query is required.');
            }

            const limit = Math.min(options.limit ?? 20, 50);
            const qb = manager
                .createQueryBuilder(Order, 'order')
                .leftJoinAndSelect('order.items', 'items')
                .where('1=1');

            if (options.siteId) {
                qb.andWhere('order.site_id = :siteId', { siteId: options.siteId });
            }
            if (options.statuses?.length) {
                qb.andWhere('order.status IN (:...statuses)', { statuses: options.statuses });
            }

            if (isFullUuid(trimmed)) {
                qb.andWhere('order.id = :id', { id: trimmed });
            } else {
                const conditions: string[] = [];
                const params: Record<string, string> = {};

                if (isUuidPrefix(trimmed)) {
                    conditions.push('CAST(order.id AS TEXT) ILIKE :uuidPrefix');
                    params.uuidPrefix = `${trimmed}%`;
                }

                const refFragment = normalizeReferenceQuery(trimmed);
                if (refFragment.length >= 2) {
                    conditions.push('order.reference ILIKE :refFragment');
                    params.refFragment = `%${refFragment}%`;
                }

                if (conditions.length === 0) {
                    throw new BadRequestException(
                        'Query too short. Enter at least 2 characters of a reference, or 4 hex characters of an ID.',
                    );
                }

                qb.andWhere(`(${conditions.join(' OR ')})`, params);
            }

            qb.orderBy('order.created_at', 'DESC').take(limit);
            const orders = await qb.getMany();
            const itemsByOrderId = await this.enrichOrderItems(manager, orders);

            const matches: OrderLookupResponse[] = [];
            for (const order of orders) {
                const client = await manager.findOne(Client, { where: { id: order.client_id } });
                const assignment = await manager.findOne(OrderStorage, {
                    where: { order_id: order.id },
                    relations: ['shelf_slot'],
                });
                matches.push({
                    order: {
                        ...order,
                        items: itemsByOrderId.get(order.id) ?? order.items ?? [],
                        client,
                    } as any,
                    slot_label: assignment?.shelf_slot?.name || null,
                    slot_type: assignment?.shelf_slot?.slot_type || null,
                });
            }

            return { count: matches.length, matches };
        });
    }

    /** Attach catalog labels so the UI can show article/service names instead of UUIDs. */
    private async enrichOrderItems(
        manager: EntityManager,
        orders: Order[],
    ): Promise<Map<string, Array<OrderItem & { article_label: string | null; service_label: string | null }>>> {
        const result = new Map<
            string,
            Array<OrderItem & { article_label: string | null; service_label: string | null }>
        >();

        const allItems = orders.flatMap((o) => o.items ?? []);
        if (allItems.length === 0) {
            for (const order of orders) {
                result.set(order.id, []);
            }
            return result;
        }

        const articleIds = [...new Set(allItems.map((i) => i.article_type_id).filter(Boolean))];
        const serviceIds = [...new Set(allItems.map((i) => i.service_definition_id).filter(Boolean))];

        const [articles, services] = await Promise.all([
            articleIds.length
                ? manager.find(ArticleType, { where: { id: In(articleIds) } })
                : Promise.resolve([] as ArticleType[]),
            serviceIds.length
                ? manager.find(ServiceDefinition, { where: { id: In(serviceIds) } })
                : Promise.resolve([] as ServiceDefinition[]),
        ]);

        const articleLabels = new Map(articles.map((a) => [a.id, a.label]));
        const serviceLabels = new Map(services.map((s) => [s.id, s.label]));

        for (const order of orders) {
            result.set(
                order.id,
                (order.items ?? []).map((item) => ({
                    ...item,
                    article_label: articleLabels.get(item.article_type_id) ?? null,
                    service_label: serviceLabels.get(item.service_definition_id) ?? null,
                })),
            );
        }

        return result;
    }

    async processDelivery(orderId: string): Promise<void> {
        return this.rls.wrapTransaction(async (manager) => {
            const order = await manager.findOne(Order, { where: { id: orderId } });
            if (!order) {
                throw new NotFoundException('Order not found');
            }

            if (order.status === OrderStatus.DELIVERED) {
                throw new ConflictException('Order is already DELIVERED');
            }

            if (order.status !== OrderStatus.STORED) {
                throw new BadRequestException(
                    `Order must be in STORED status to be delivered (Current: ${order.status}). Store in a delivery shelf first.`,
                );
            }

            if (order.payment_status !== PaymentStatus.PAID) {
                const balanceDue = Number(order.total_price) - Number(order.amount_paid || 0);
                throw new BadRequestException(
                    `Le solde de ${balanceDue.toFixed(0)} doit être réglé avant la livraison.`,
                );
            }

            const assignments = await manager.find(OrderStorage, {
                where: { order_id: orderId },
                relations: ['shelf_slot'],
            });

            if (assignments.length === 0) {
                throw new BadRequestException('Order has no storage location. Cannot deliver without knowing shelf location.');
            }

            for (const assignment of assignments) {
                if (assignment.shelf_slot) {
                    assignment.shelf_slot.status = StorageSlotStatus.FREE;
                    await manager.save(StorageSlot, assignment.shelf_slot);
                }
            }

            await manager.remove(OrderStorage, assignments);

            order.status = OrderStatus.DELIVERED;
            await manager.save(Order, order);
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const buffer = file.buffer;
        if (!buffer || buffer.length === 0) {
            throw new BadRequestException('Uploaded file is empty');
        }

        const uploadDir = path.resolve(process.cwd(), 'uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileExt = path.extname(file.originalname) || '.bin';
        const fileName = `${uuidv4()}${fileExt}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, buffer);

        const baseUrl = process.env.API_URL || 'http://localhost:3000';
        return `${baseUrl}/uploads/${fileName}`;
    }
}
