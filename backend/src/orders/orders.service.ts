import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In, EntityManager, SelectQueryBuilder } from 'typeorm';
import { Order, ServiceLevel } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { DeliveryMode } from './enums/delivery-mode.enum';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDeliveryDto } from './dto/update-order-delivery.dto';
import { TenantService } from '../tenant/tenant.service';
import { PricingService } from '../catalog/services/pricing.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';
import { StorageService } from '../storage/storage.service';
import { SlotType } from '../storage/entities/storage-slot.entity';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentPhase } from '../payments/enums/payment-phase.enum';
import { PaymentMethod } from '../payments/enums/payment-method.enum';
import { CashRegisterSession } from '../cash-register/entities/cash-register-session.entity';
import { SessionStatus } from '../cash-register/enums/session-status.enum';
import { OperationKey } from '../subscription/enums/operation-key.enum';
import { QuotaService } from '../subscription/services/quota.service';
import { Client } from '../clients/entities/client.entity';
import { Site } from '../sites/entities/site.entity';
import { Locality } from '../localities/entities/locality.entity';
import { NotificationService } from '../notifications/notification.service';
import { TEMPLATE_ORDER_READY_PICKUP } from '../notifications/types/notify-payload';
import {
    formatOrderReference,
    isFullUuid,
    isUuidPrefix,
    normalizeReferenceQuery,
} from './utils/order-reference.util';
import { ArticleType } from '../catalog/entities/article-type.entity';
import { ServiceDefinition } from '../catalog/entities/service-definition.entity';

export type OrderStatusFilter = 'all' | 'ready' | 'processing' | 'late';

export interface OrderItemEnriched extends OrderItem {
    article_label?: string | null;
    service_label?: string | null;
}

export interface OrderWithStorage extends Omit<Order, 'items'> {
    client_name?: string;
    client_phone?: string | null;
    client_email?: string | null;
    slot_label?: string | null;
    slot_type?: SlotType | null;
    items?: OrderItemEnriched[];
}

export interface FindAllOrdersOptions {
    statusFilter?: OrderStatusFilter;
    search?: string;
}

export interface OrderLookupResult {
    count: number;
    orders: OrderWithStorage[];
}

export interface OrderLookupOptions {
    statuses?: OrderStatus[];
    siteId?: string;
    limit?: number;
}

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(Client)
        private clientRepository: Repository<Client>,
        @InjectRepository(Site)
        private siteRepository: Repository<Site>,
        private tenantService: TenantService,
        private pricingService: PricingService,
        private dataSource: DataSource,
        @Inject(forwardRef(() => StorageService))
        private storageService: StorageService,
        private quotaService: QuotaService,
        private notificationService: NotificationService,
    ) { }

    async create(createOrderDto: CreateOrderDto, tenantId: string, userId?: string, siteId?: string, userRoles?: string[]): Promise<Order> {
        this.logger.log(`Creating order for tenant ${tenantId}`);

        await this.quotaService.assertWithinQuota(tenantId, OperationKey.ORDERS_CREATE, userRoles);

        const savedOrder = await this.dataSource.transaction(async manager => {
            // 1. Fetch Tenant Config
            const tenant = await this.tenantService.findOne(tenantId);

            // 2. Calculate Total Price and Validate Items
            let calculatedTotal = 0;
            const orderItemsByEntity: OrderItem[] = [];

            if (createOrderDto.items && createOrderDto.items.length > 0) {
                for (const itemDto of createOrderDto.items) {
                    // Fetch authoritative price
                    const unitPrice = await this.pricingService.getPrice(
                        tenantId,
                        itemDto.article_type_id,
                        itemDto.service_definition_id
                    );

                    calculatedTotal += (unitPrice * itemDto.quantity);

                    // Prepare OrderItem entity (not saved yet)
                    const orderItem = new OrderItem();
                    orderItem.article_type_id = itemDto.article_type_id;
                    orderItem.service_definition_id = itemDto.service_definition_id;
                    orderItem.quantity = itemDto.quantity;
                    orderItem.price = unitPrice; // Trust backend price
                    orderItemsByEntity.push(orderItem);
                }

                // Apply Multiplier
                const isExpress = createOrderDto.service_level === ServiceLevel.EXPRESS;
                const multiplier = isExpress && tenant.express_multiplier ? Number(tenant.express_multiplier) : 1.0;
                calculatedTotal = Number((calculatedTotal * multiplier).toFixed(2));

                // Log mismatch if needed, but ALWAYS use calculated total
                if (Math.abs(calculatedTotal - Number(createOrderDto.total_price)) > 0.05) {
                    this.logger.warn(`Price Mismatch. Provided: ${createOrderDto.total_price}, Calculated: ${calculatedTotal}. Using Calculated.`);
                }
            } else {
                this.logger.warn('Creating order with NO items. Price set to 0 or provided default.');
                // Should we block empty orders? Story AC says "Prevents validation if Order Draft is empty".
                // Controller/DTO checks validaton, but logical check here:
                throw new BadRequestException('Order must have items.'); // Or rely on DTO @ArrayMinSize
            }

            // 3. Due Date Calculation
            const createdDate = new Date();
            const isExpress = createOrderDto.service_level === ServiceLevel.EXPRESS;
            const slaHours = isExpress ? (tenant.express_sla_hours || 24) : 48;
            const expectedDueDate = new Date(createdDate.getTime() + (slaHours * 60 * 60 * 1000));

            // 4. Create Order Entity with human-readable reference
            const reference = await this.generateOrderReference(
                manager,
                tenantId,
                createOrderDto.site_id,
                createdDate,
            );

            const deliveryMode = createOrderDto.delivery_mode ?? DeliveryMode.PICKUP;
            if (deliveryMode === DeliveryMode.HOME_DELIVERY) {
                if (!createOrderDto.delivery_address?.trim()) {
                    throw new BadRequestException('delivery_address is required for HOME_DELIVERY');
                }
                if (!createOrderDto.delivery_phone?.trim()) {
                    throw new BadRequestException('delivery_phone is required for HOME_DELIVERY');
                }
                if (!createOrderDto.locality_id) {
                    throw new BadRequestException('locality_id is required for HOME_DELIVERY');
                }
                const locality = await manager.findOne(Locality, {
                    where: {
                        id: createOrderDto.locality_id,
                        tenant_id: tenantId,
                        site_id: createOrderDto.site_id,
                        is_active: true,
                    },
                });
                if (!locality) {
                    throw new BadRequestException('Locality not found for this site');
                }
            }

            const newOrder = manager.create(Order, {
                tenant_id: tenantId,
                site_id: createOrderDto.site_id,
                client_id: createOrderDto.client_id,
                status: OrderStatus.CREATED,
                service_level: isExpress ? ServiceLevel.EXPRESS : ServiceLevel.NORMAL,
                delivery_mode: deliveryMode,
                delivery_address:
                    deliveryMode === DeliveryMode.HOME_DELIVERY
                        ? createOrderDto.delivery_address!.trim()
                        : null,
                delivery_phone:
                    deliveryMode === DeliveryMode.HOME_DELIVERY
                        ? createOrderDto.delivery_phone!.trim()
                        : null,
                locality_id:
                    deliveryMode === DeliveryMode.HOME_DELIVERY
                        ? createOrderDto.locality_id!
                        : null,
                due_date: expectedDueDate,
                total_price: calculatedTotal,
                created_at: createdDate,
                reference,
            });

            // Save Order first to generate ID
            const savedOrder = await manager.save(newOrder);

            // 5. Associate and Save Items (attach to response so clients get item UUIDs)
            const savedItems: OrderItem[] = [];
            for (const item of orderItemsByEntity) {
                item.order = savedOrder;
                const savedItem = await manager.save(OrderItem, item);
                // Drop back-reference to avoid circular JSON on the API response
                delete (savedItem as Partial<OrderItem>).order;
                savedItems.push(savedItem);
            }
            savedOrder.items = savedItems;

            // 6. Handle initial payment if provided
            if (createOrderDto.initial_payment_amount && createOrderDto.initial_payment_amount > 0 && userId) {
                const paymentMethod = createOrderDto.initial_payment_method || PaymentMethod.CASH;

                // Find open session for operator
                const session = await manager.findOne(CashRegisterSession, {
                    where: { operator_id: userId, tenant_id: tenantId, status: SessionStatus.OPEN },
                });
                if (!session) {
                    throw new BadRequestException(
                        'Vous devez ouvrir votre caisse avant d\'encaisser un paiement.',
                    );
                }

                const paymentAmount = Math.min(createOrderDto.initial_payment_amount, calculatedTotal);
                const payment = manager.create(Payment, {
                    tenant_id: tenantId,
                    order_id: savedOrder.id,
                    amount: paymentAmount,
                    payment_method: paymentMethod,
                    payment_phase: PaymentPhase.AT_ORDER,
                    collected_by: userId,
                    site_id: siteId || createOrderDto.site_id,
                    session_id: session.id,
                    reference: createOrderDto.initial_payment_reference,
                });
                await manager.save(Payment, payment);

                savedOrder.amount_paid = paymentAmount;
                if (paymentAmount >= calculatedTotal - 0.01) {
                    savedOrder.payment_status = PaymentStatus.PAID;
                } else {
                    savedOrder.payment_status = PaymentStatus.PARTIAL;
                }
                await manager.save(Order, savedOrder);

                if (paymentMethod === PaymentMethod.CASH) {
                    session.expected_cash = Number(
                        (Number(session.expected_cash) + paymentAmount).toFixed(2),
                    );
                    await manager.save(CashRegisterSession, session);
                }
            }

            return savedOrder;
        });

        await this.quotaService.recordUsage(tenantId, OperationKey.ORDERS_CREATE, savedOrder.id);
        return savedOrder;
    }

    async updateStatus(id: string, newStatus: OrderStatus, tenantId: string): Promise<OrderWithStorage> {
        this.logger.log(`Updating status for order ${id} to ${newStatus} (Tenant: ${tenantId})`);

        const order = await this.ordersRepository.findOne({
            where: { id, tenant_id: tenantId }
        });

        if (!order) {
            throw new BadRequestException('Order not found or access denied.');
        }

        this.validateStatusTransition(order.status, newStatus);

        // CREATED → IN_PROGRESS: must destock from reception slot first
        if (order.status === OrderStatus.CREATED && newStatus === OrderStatus.IN_PROGRESS) {
            const storageInfo = await this.storageService.getOrderStorageInfo(id);
            if (!storageInfo.slot_label) {
                throw new BadRequestException(
                    'Order must be stored in a reception slot before processing. Scan a reception shelf first.',
                );
            }
            if (storageInfo.slot_type !== SlotType.RECEPTION) {
                throw new BadRequestException('Order must be destocked from reception before processing.');
            }
            await this.storageService.releaseOrder(id);
        }

        order.status = newStatus;
        const saved = await this.ordersRepository.save(order);

        if (
            newStatus === OrderStatus.READY &&
            saved.delivery_mode === DeliveryMode.PICKUP
        ) {
            void this.notifyOrderReadyPickup(saved).catch((err) => {
                this.logger.error(
                    `Failed to send READY pickup notification for order ${saved.id}`,
                    err,
                );
            });
        }

        return await this.mapOrderWithClient(saved);
    }

    async updateDelivery(
        id: string,
        tenantId: string,
        dto: UpdateOrderDeliveryDto,
    ): Promise<OrderWithStorage> {
        const order = await this.ordersRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!order) {
            throw new BadRequestException('Order not found or access denied.');
        }
        if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Cannot update delivery info for a closed order.');
        }
        if (order.delivery_mode !== DeliveryMode.HOME_DELIVERY) {
            throw new BadRequestException('Order is not a home delivery order.');
        }

        if (dto.delivery_address !== undefined) {
            order.delivery_address = dto.delivery_address.trim();
        }
        if (dto.delivery_phone !== undefined) {
            order.delivery_phone = dto.delivery_phone.trim();
        }
        if (dto.locality_id !== undefined) {
            const locality = await this.dataSource.getRepository(Locality).findOne({
                where: {
                    id: dto.locality_id,
                    tenant_id: tenantId,
                    site_id: order.site_id,
                    is_active: true,
                },
            });
            if (!locality) {
                throw new BadRequestException('Locality not found for this site');
            }
            order.locality_id = dto.locality_id;
        }

        const saved = await this.ordersRepository.save(order);
        return this.mapOrderWithClient(saved);
    }

    private async notifyOrderReadyPickup(order: Order): Promise<void> {
        const client = await this.clientRepository.findOne({
            where: { id: order.client_id },
        });
        const site = await this.siteRepository.findOne({
            where: { id: order.site_id },
        });
        const ref = order.reference || order.id.slice(0, 8);
        const agency = site?.name || 'votre agence';
        const subject = `Commande ${ref} prête`;
        const body =
            `Bonjour${client ? ` ${client.first_name}` : ''},\n\n` +
            `Votre commande ${ref} est prête. Vous pouvez venir la récupérer à ${agency}.\n\n` +
            `CleanTrack Pro`;
        const smsBody = `CleanTrack: Commande ${ref} prête à ${agency}. Vous pouvez venir la récupérer.`;

        await this.notificationService.notify(order.tenant_id, {
            orderId: order.id,
            templateKey: TEMPLATE_ORDER_READY_PICKUP,
            email: client?.email ?? null,
            phone: client?.phone ?? null,
            subject,
            body,
            smsBody,
        });
    }

    async findOne(id: string, tenantId: string): Promise<OrderWithStorage> {
        const result = await this.lookup(id, tenantId);
        if (result.count === 0) {
            throw new BadRequestException('Order not found or access denied.');
        }
        if (result.count > 1) {
            throw new BadRequestException(
                'Multiple orders match this query. Please enter more characters or use lookup.',
            );
        }
        return result.orders[0];
    }

    /**
     * Elastic lookup by full/partial UUID or human reference (e.g. 136, REF-01-2507-000136).
     * Returns all matches (capped) so the UI can present a picker when count > 1.
     */
    async lookup(
        query: string,
        tenantId: string,
        options: OrderLookupOptions = {},
    ): Promise<OrderLookupResult> {
        const trimmed = (query || '').trim();
        if (!trimmed) {
            throw new BadRequestException('Query is required.');
        }

        const limit = Math.min(options.limit ?? 20, 50);
        const qb = this.ordersRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndMapOne('order.client', Client, 'client', 'client.id::text = order.client_id')
            .where('order.tenant_id = :tenantId', { tenantId });

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
        const mapped = await Promise.all(orders.map((o) => this.mapOrderWithClient(o)));

        return { count: mapped.length, orders: mapped };
    }

    private async generateOrderReference(
        manager: EntityManager,
        tenantId: string,
        siteId: string,
        createdAt: Date,
    ): Promise<string> {
        const site = await manager.findOne(Site, { where: { id: siteId, tenant_id: tenantId } });
        if (!site) {
            throw new BadRequestException('Site not found or access denied.');
        }

        const year = createdAt.getFullYear();
        const month = createdAt.getMonth(); // 0-based
        const periodStart = new Date(year, month, 1);
        const periodEnd = new Date(year, month + 1, 1);

        const count = await manager
            .createQueryBuilder(Order, 'order')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.site_id = :siteId', { siteId })
            .andWhere('order.created_at >= :periodStart', { periodStart })
            .andWhere('order.created_at < :periodEnd', { periodEnd })
            .getCount();

        return formatOrderReference(site.code, createdAt, count + 1);
    }

    private async resolveClient(order: Order): Promise<Client | undefined> {
        const joined = (order as Order & { client?: Client }).client;
        if (joined?.first_name || joined?.last_name || joined?.phone) {
            return joined;
        }
        if (!order.client_id) return undefined;
        return (await this.clientRepository.findOne({ where: { id: order.client_id } })) ?? undefined;
    }

    private async enrichOrderItems(order: Order): Promise<OrderItemEnriched[]> {
        const items = order.items ?? [];
        if (items.length === 0) return [];

        const articleIds = [...new Set(items.map((i) => i.article_type_id).filter(Boolean))];
        const serviceIds = [...new Set(items.map((i) => i.service_definition_id).filter(Boolean))];

        const [articles, services] = await Promise.all([
            articleIds.length
                ? this.dataSource.getRepository(ArticleType).find({ where: { id: In(articleIds) } })
                : Promise.resolve([] as ArticleType[]),
            serviceIds.length
                ? this.dataSource.getRepository(ServiceDefinition).find({ where: { id: In(serviceIds) } })
                : Promise.resolve([] as ServiceDefinition[]),
        ]);

        const articleLabels = new Map(articles.map((a) => [a.id, a.label]));
        const serviceLabels = new Map(services.map((s) => [s.id, s.label]));

        return items.map((item) => ({
            ...item,
            article_label: articleLabels.get(item.article_type_id) ?? null,
            service_label: serviceLabels.get(item.service_definition_id) ?? null,
        }));
    }

    private async mapOrderWithClient(order: Order): Promise<OrderWithStorage> {
        const client = await this.resolveClient(order);
        const clientName = client
            ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client inconnu'
            : 'Client inconnu';
        const storageInfo = await this.storageService.getOrderStorageInfo(order.id);
        const enrichedItems = await this.enrichOrderItems(order);

        return {
            ...order,
            items: enrichedItems,
            client_name: clientName,
            client_phone: client?.phone ?? null,
            client_email: client?.email ?? null,
            slot_label: storageInfo.slot_label,
            slot_type: storageInfo.slot_type,
        };
    }

    private validateStatusTransition(current: OrderStatus, next: OrderStatus): void {
        const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.CREATED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
            [OrderStatus.IN_PROGRESS]: [OrderStatus.READY, OrderStatus.CANCELLED],
            [OrderStatus.READY]: [OrderStatus.CANCELLED],
            [OrderStatus.STORED]: [OrderStatus.CANCELLED],
            [OrderStatus.DELIVERED]: [],
            [OrderStatus.CANCELLED]: [],
        };

        const allowed = allowedTransitions[current] || [];
        if (!allowed.includes(next)) {
            throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
        }
    }


    async getDashboardStats(
        tenantId: string,
        timezone: string = 'UTC',
        startDate?: string,
        endDate?: string,
        siteId?: string,
        serviceId?: string,
    ): Promise<DashboardStatsDto> {
        let startPeriod: Date;
        let endPeriod: Date;

        if (startDate && endDate) {
            // Use provided range (assuming YYYY-MM-DD from frontend, treated as start of that day in tenant TZ)
            const startZoned = toZonedTime(new Date(startDate), timezone);
            const endZoned = toZonedTime(new Date(endDate), timezone);
            startPeriod = fromZonedTime(startOfDay(startZoned), timezone);
            endPeriod = fromZonedTime(endOfDay(endZoned), timezone);
        } else {
            // Default to Today
            const now = new Date();
            const startOfDayZoned = startOfDay(toZonedTime(now, timezone));
            const endOfDayZoned = endOfDay(toZonedTime(now, timezone));
            startPeriod = fromZonedTime(startOfDayZoned, timezone);
            endPeriod = fromZonedTime(endOfDayZoned, timezone);
        }

        if (serviceId) {
            const countQb = this.ordersRepository
                .createQueryBuilder('order')
                .where('order.tenant_id = :tenantId', { tenantId })
                .andWhere('order.created_at BETWEEN :start AND :end', {
                    start: startPeriod,
                    end: endPeriod,
                })
                .andWhere(
                    `EXISTS (
                        SELECT 1 FROM order_items oi
                        WHERE oi.order_id = order.id
                          AND oi.service_definition_id = :serviceId
                    )`,
                    { serviceId },
                );
            if (siteId) countQb.andWhere('order.site_id = :siteId', { siteId });

            const ordersToday = await countQb.getCount();

            const revenueQb = this.ordersRepository
                .createQueryBuilder('order')
                .select('COALESCE(SUM(order.total_price), 0)', 'total')
                .where('order.tenant_id = :tenantId', { tenantId })
                .andWhere('order.created_at BETWEEN :start AND :end', {
                    start: startPeriod,
                    end: endPeriod,
                })
                .andWhere(
                    `EXISTS (
                        SELECT 1 FROM order_items oi
                        WHERE oi.order_id = order.id
                          AND oi.service_definition_id = :serviceId
                    )`,
                    { serviceId },
                );
            if (siteId) revenueQb.andWhere('order.site_id = :siteId', { siteId });
            const rev = await revenueQb.getRawOne();

            const pendingQb = this.ordersRepository
                .createQueryBuilder('order')
                .where('order.tenant_id = :tenantId', { tenantId })
                .andWhere('order.created_at BETWEEN :start AND :end', {
                    start: startPeriod,
                    end: endPeriod,
                })
                .andWhere('order.status IN (:...statuses)', {
                    statuses: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.READY],
                })
                .andWhere(
                    `EXISTS (
                        SELECT 1 FROM order_items oi
                        WHERE oi.order_id = order.id
                          AND oi.service_definition_id = :serviceId
                    )`,
                    { serviceId },
                );
            if (siteId) pendingQb.andWhere('order.site_id = :siteId', { siteId });

            return {
                ordersToday,
                revenueToday: rev?.total ? parseFloat(rev.total) : 0,
                pendingOrders: await pendingQb.getCount(),
            };
        }

        const whereClause: any = {
            tenant_id: tenantId,
            created_at: Between(startPeriod, endPeriod)
        };

        if (siteId) {
            whereClause.site_id = siteId;
        }

        // 1. Orders Today
        const ordersToday = await this.ordersRepository.count({
            where: whereClause
        });

        // 2. Revenue Today
        const revenueQuery = this.ordersRepository
            .createQueryBuilder('order')
            .select('SUM(order.total_price)', 'total')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.created_at BETWEEN :start AND :end', { start: startPeriod, end: endPeriod });

        if (siteId) {
            revenueQuery.andWhere('order.site_id = :siteId', { siteId });
        }

        const revenueResult = await revenueQuery.getRawOne();
        const revenueToday = revenueResult && revenueResult.total ? parseFloat(revenueResult.total) : 0;

        // 3. Pending Orders (within the selected date range)
        // Note: Logic for pending orders might need to be independent of date range if "Pending" means currently incomplete regardless of creation date.
        // However, existing implementation filters by date. Keeping consistent.
        const pendingWhereClause: any = {
            tenant_id: tenantId,
            status: In([OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.READY]),
            created_at: Between(startPeriod, endPeriod)
        };

        if (siteId) {
            pendingWhereClause.site_id = siteId;
        }

        const pendingOrders = await this.ordersRepository.count({
            where: pendingWhereClause
        });

        return {
            ordersToday,
            revenueToday,
            pendingOrders
        };
    }

    async getWeeklyStats(tenantId: string, siteId?: string): Promise<any[]> {
        // Get last 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // 7 days inclusive

        // Truncate to start of day if desired, but for graph we just need daily buckets
        // Using common table expression or simple loop is overkill?
        // Let's use TypeORM builder to group by date

        const query = this.ordersRepository.createQueryBuilder('order')
            .select("TO_CHAR(order.created_at, 'YYYY-MM-DD')", 'date')
            .addSelect("SUM(order.total_price)", "revenue")
            .addSelect("COUNT(order.id)", "orders")
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.created_at >= :startDate', { startDate })
            .groupBy("TO_CHAR(order.created_at, 'YYYY-MM-DD')")
            .orderBy('date', 'ASC');

        if (siteId) {
            query.andWhere('order.site_id = :siteId', { siteId });
        }

        const rawResults = await query.getRawMany();

        // Fill in missing days
        const stats = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];

            const existing = rawResults.find(r => r.date === dateStr);

            stats.push({
                name: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()], // Check localization?
                revenue: existing ? parseFloat(existing.revenue) : 0,
                orders: existing ? parseInt(existing.orders) : 0
            });
        }

        return stats;
    }

    private resolvePeriod(
        timezone: string = 'UTC',
        startDate?: string,
        endDate?: string,
    ): { startPeriod: Date; endPeriod: Date } {
        if (startDate && endDate) {
            const startZoned = toZonedTime(new Date(startDate), timezone);
            const endZoned = toZonedTime(new Date(endDate), timezone);
            return {
                startPeriod: fromZonedTime(startOfDay(startZoned), timezone),
                endPeriod: fromZonedTime(endOfDay(endZoned), timezone),
            };
        }
        const now = new Date();
        return {
            startPeriod: fromZonedTime(startOfDay(toZonedTime(now, timezone)), timezone),
            endPeriod: fromZonedTime(endOfDay(toZonedTime(now, timezone)), timezone),
        };
    }

    /**
     * Revenue / order counts per site for the selected period,
     * plus current active order counts (not period-scoped).
     */
    async getStatsBySite(
        tenantId: string,
        timezone: string = 'UTC',
        startDate?: string,
        endDate?: string,
    ): Promise<
        Array<{
            siteId: string;
            siteName: string;
            revenue: number;
            orders: number;
            activeOrders: number;
        }>
    > {
        const { startPeriod, endPeriod } = this.resolvePeriod(timezone, startDate, endDate);

        const periodRows = await this.dataSource
            .createQueryBuilder()
            .select('site.id', 'siteId')
            .addSelect('site.name', 'siteName')
            .addSelect('COALESCE(SUM(ord.total_price), 0)', 'revenue')
            .addSelect('COUNT(ord.id)', 'orders')
            .from('sites', 'site')
            .leftJoin(
                'orders',
                'ord',
                'ord.site_id::text = site.id::text AND ord.tenant_id::text = site.tenant_id::text AND ord.created_at BETWEEN :start AND :end',
                { start: startPeriod, end: endPeriod },
            )
            .where('site.tenant_id::text = :tenantId', { tenantId })
            .groupBy('site.id')
            .addGroupBy('site.name')
            .orderBy('COALESCE(SUM(ord.total_price), 0)', 'DESC')
            .getRawMany();

        const activeRows = await this.ordersRepository
            .createQueryBuilder('order')
            .select('order.site_id', 'siteId')
            .addSelect('COUNT(order.id)', 'activeOrders')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.status IN (:...statuses)', {
                statuses: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.READY],
            })
            .groupBy('order.site_id')
            .getRawMany();

        const activeMap = new Map(
            activeRows.map((r) => [String(r.siteId), parseInt(r.activeOrders, 10) || 0]),
        );

        return periodRows.map((row) => ({
            siteId: String(row.siteId),
            siteName: String(row.siteName || 'Agence'),
            revenue: parseFloat(row.revenue) || 0,
            orders: parseInt(row.orders, 10) || 0,
            activeOrders: activeMap.get(String(row.siteId)) ?? 0,
        }));
    }

    /**
     * Order counts per hour for a given calendar day (defaults to today in timezone).
     * Returns 24 buckets (0–23).
     */
    async getHourlyStats(
        tenantId: string,
        timezone: string = 'UTC',
        siteId?: string,
        date?: string,
    ): Promise<Array<{ hour: number; label: string; orders: number }>> {
        const day = date || new Date().toISOString().split('T')[0];
        const { startPeriod, endPeriod } = this.resolvePeriod(timezone, day, day);

        const query = this.ordersRepository
            .createQueryBuilder('order')
            .select(`EXTRACT(HOUR FROM order.created_at AT TIME ZONE :tz)`, 'hour')
            .addSelect('COUNT(order.id)', 'orders')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.created_at BETWEEN :start AND :end', {
                start: startPeriod,
                end: endPeriod,
            })
            .setParameter('tz', timezone)
            .groupBy('hour')
            .orderBy('hour', 'ASC');

        if (siteId) {
            query.andWhere('order.site_id = :siteId', { siteId });
        }

        const raw = await query.getRawMany();
        const byHour = new Map<number, number>();
        for (const row of raw) {
            const hour = parseInt(String(row.hour), 10);
            if (!Number.isNaN(hour)) {
                byHour.set(hour, parseInt(row.orders, 10) || 0);
            }
        }

        const buckets: Array<{ hour: number; label: string; orders: number }> = [];
        for (let h = 0; h < 24; h++) {
            buckets.push({
                hour: h,
                label: `${String(h).padStart(2, '0')}:00`,
                orders: byHour.get(h) ?? 0,
            });
        }
        return buckets;
    }

    /**
     * Active orders past their due_date (SLA breach).
     */
    async getDelayedStats(
        tenantId: string,
        siteId?: string,
    ): Promise<{ delayedOrders: number }> {
        const query = this.ordersRepository
            .createQueryBuilder('order')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.status IN (:...statuses)', {
                statuses: [
                    OrderStatus.CREATED,
                    OrderStatus.IN_PROGRESS,
                    OrderStatus.READY,
                    OrderStatus.STORED,
                ],
            })
            .andWhere('order.due_date < :now', { now: new Date() });

        if (siteId) {
            query.andWhere('order.site_id = :siteId', { siteId });
        }

        const delayedOrders = await query.getCount();
        return { delayedOrders };
    }

    /**
     * Daily revenue / order counts for an arbitrary date range (filled gaps = 0).
     * Optional serviceId filters to orders that contain at least one item with that service.
     */
    async getTimeseriesStats(
        tenantId: string,
        timezone: string = 'UTC',
        startDate: string,
        endDate: string,
        siteId?: string,
        serviceId?: string,
    ): Promise<Array<{ date: string; label: string; revenue: number; orders: number }>> {
        const { startPeriod, endPeriod } = this.resolvePeriod(timezone, startDate, endDate);

        const query = this.ordersRepository
            .createQueryBuilder('order')
            .select(`TO_CHAR(order.created_at AT TIME ZONE :tz, 'YYYY-MM-DD')`, 'date')
            .addSelect('COALESCE(SUM(order.total_price), 0)', 'revenue')
            .addSelect('COUNT(DISTINCT order.id)', 'orders')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.created_at BETWEEN :start AND :end', {
                start: startPeriod,
                end: endPeriod,
            })
            .setParameter('tz', timezone)
            .groupBy(`TO_CHAR(order.created_at AT TIME ZONE :tz, 'YYYY-MM-DD')`)
            .orderBy('date', 'ASC');

        if (siteId) {
            query.andWhere('order.site_id = :siteId', { siteId });
        }
        if (serviceId) {
            query
                .innerJoin('order.items', 'items')
                .andWhere('items.service_definition_id = :serviceId', { serviceId });
        }

        const raw = await query.getRawMany();
        const byDate = new Map(
            raw.map((r) => [
                String(r.date),
                {
                    revenue: parseFloat(r.revenue) || 0,
                    orders: parseInt(r.orders, 10) || 0,
                },
            ]),
        );

        const days: Array<{ date: string; label: string; revenue: number; orders: number }> = [];
        const cursor = new Date(startDate + 'T12:00:00Z');
        const end = new Date(endDate + 'T12:00:00Z');
        while (cursor <= end) {
            const dateStr = cursor.toISOString().split('T')[0];
            const existing = byDate.get(dateStr);
            days.push({
                date: dateStr,
                label: dateStr.slice(5), // MM-DD
                revenue: existing?.revenue ?? 0,
                orders: existing?.orders ?? 0,
            });
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        return days;
    }

    /**
     * Average processing time (hours) from creation to last update for completed-ish orders,
     * plus completion rate (DELIVERED / created in period).
     */
    async getThroughputStats(
        tenantId: string,
        timezone: string = 'UTC',
        startDate?: string,
        endDate?: string,
        siteId?: string,
        serviceId?: string,
    ): Promise<{
        avgHours: number;
        completionRate: number;
        completedCount: number;
        createdCount: number;
        delayedOrders: number;
    }> {
        const { startPeriod, endPeriod } = this.resolvePeriod(timezone, startDate, endDate);

        const baseQb = () => {
            const qb = this.ordersRepository
                .createQueryBuilder('order')
                .where('order.tenant_id = :tenantId', { tenantId })
                .andWhere('order.created_at BETWEEN :start AND :end', {
                    start: startPeriod,
                    end: endPeriod,
                });
            if (siteId) qb.andWhere('order.site_id = :siteId', { siteId });
            if (serviceId) {
                qb.innerJoin('order.items', 'items').andWhere(
                    'items.service_definition_id = :serviceId',
                    { serviceId },
                );
            }
            return qb;
        };

        const createdCount = await baseQb().getCount();

        const completedCount = await baseQb()
            .andWhere('order.status = :delivered', { delivered: OrderStatus.DELIVERED })
            .getCount();

        const avgRaw = await baseQb()
            .andWhere('order.status IN (:...done)', {
                done: [OrderStatus.READY, OrderStatus.STORED, OrderStatus.DELIVERED],
            })
            .select(
                'AVG(EXTRACT(EPOCH FROM (order.updated_at - order.created_at)) / 3600.0)',
                'avgHours',
            )
            .getRawOne();

        const delayed = await this.getDelayedStats(tenantId, siteId);

        return {
            avgHours: avgRaw?.avgHours ? Math.round(parseFloat(avgRaw.avgHours) * 10) / 10 : 0,
            completionRate:
                createdCount > 0 ? Math.round((completedCount / createdCount) * 100) : 0,
            completedCount,
            createdCount,
            delayedOrders: delayed.delayedOrders,
        };
    }

    /**
     * Order volume / revenue broken down by service definition for the period.
     */
    async getStatsByService(
        tenantId: string,
        timezone: string = 'UTC',
        startDate?: string,
        endDate?: string,
        siteId?: string,
    ): Promise<Array<{ serviceId: string; label: string; orders: number; revenue: number }>> {
        const { startPeriod, endPeriod } = this.resolvePeriod(timezone, startDate, endDate);

        const qb = this.ordersRepository
            .createQueryBuilder('order')
            .innerJoin('order.items', 'items')
            .leftJoin(
                'service_definitions',
                'svc',
                'svc.id::text = items.service_definition_id::text',
            )
            .select('items.service_definition_id', 'serviceId')
            .addSelect('COALESCE(svc.label, :fallback)', 'label')
            .addSelect('COUNT(DISTINCT order.id)', 'orders')
            .addSelect('COALESCE(SUM(items.price * items.quantity), 0)', 'revenue')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.created_at BETWEEN :start AND :end', {
                start: startPeriod,
                end: endPeriod,
            })
            .setParameter('fallback', 'Service')
            .groupBy('items.service_definition_id')
            .addGroupBy('svc.label')
            .orderBy('COUNT(DISTINCT order.id)', 'DESC');

        if (siteId) {
            qb.andWhere('order.site_id = :siteId', { siteId });
        }

        const rows = await qb.getRawMany();
        return rows.map((r) => ({
            serviceId: String(r.serviceId),
            label: String(r.label || 'Service'),
            orders: parseInt(r.orders, 10) || 0,
            revenue: parseFloat(r.revenue) || 0,
        }));
    }

    private applyStatusFilter(
        query: SelectQueryBuilder<Order>,
        statusFilter?: OrderStatusFilter,
    ): void {
        if (!statusFilter || statusFilter === 'all') return;

        if (statusFilter === 'ready') {
            query.andWhere('order.status IN (:...readyStatuses)', {
                readyStatuses: [OrderStatus.READY, OrderStatus.STORED],
            });
            return;
        }

        if (statusFilter === 'processing') {
            query.andWhere('order.status IN (:...processingStatuses)', {
                processingStatuses: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS],
            });
            return;
        }

        if (statusFilter === 'late') {
            query.andWhere('order.due_date < NOW()');
            query.andWhere('order.status NOT IN (:...closedStatuses)', {
                closedStatuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            });
        }
    }

    private async getOrderStatusCounts(tenantId: string, clientId?: string): Promise<{
        all: number;
        ready: number;
        processing: number;
        late: number;
    }> {
        const base = this.ordersRepository
            .createQueryBuilder('order')
            .where('order.tenant_id = :tenantId', { tenantId });

        if (clientId) {
            base.andWhere('order.client_id = :clientId', { clientId });
        }

        const [all, ready, processing, late] = await Promise.all([
            base.clone().getCount(),
            base
                .clone()
                .andWhere('order.status IN (:...readyStatuses)', {
                    readyStatuses: [OrderStatus.READY, OrderStatus.STORED],
                })
                .getCount(),
            base
                .clone()
                .andWhere('order.status IN (:...processingStatuses)', {
                    processingStatuses: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS],
                })
                .getCount(),
            base
                .clone()
                .andWhere('order.due_date < NOW()')
                .andWhere('order.status NOT IN (:...closedStatuses)', {
                    closedStatuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
                })
                .getCount(),
        ]);

        return { all, ready, processing, late };
    }

    async findAll(
        tenantId: string,
        page: number = 1,
        limit: number = 50,
        type: 'active' | 'all' = 'active',
        clientId?: string,
        options: FindAllOrdersOptions = {},
    ): Promise<{ data: any[]; meta: any }> {
        const skip = (page - 1) * limit;
        const statusFilter = options.statusFilter ?? 'all';
        const search = options.search?.trim();

        const query = this.ordersRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndMapOne('order.client', Client, 'client', 'client.id::text = order.client_id')
            .where('order.tenant_id = :tenantId', { tenantId });

        if (clientId) {
            query.andWhere('order.client_id = :clientId', { clientId });
        }

        if (type === 'active' && !clientId && statusFilter === 'all') {
            query.andWhere('order.status IN (:...statuses)', {
                statuses: [
                    OrderStatus.CREATED,
                    OrderStatus.IN_PROGRESS,
                    OrderStatus.READY,
                    OrderStatus.STORED,
                ],
            });
        }

        this.applyStatusFilter(query, statusFilter);

        if (search) {
            query.andWhere(
                `(order.reference ILIKE :search
                  OR CAST(order.id AS TEXT) ILIKE :search
                  OR client.first_name ILIKE :search
                  OR client.last_name ILIKE :search
                  OR client.phone ILIKE :search
                  OR CONCAT(client.first_name, ' ', client.last_name) ILIKE :search)`,
                { search: `%${search}%` },
            );
        }

        // History / filtered lists: newest first. Legacy "active" urgency sort only when no status chip.
        const useNewestFirst =
            !!clientId ||
            type === 'all' ||
            statusFilter !== 'all' ||
            !!search;

        if (useNewestFirst) {
            query.orderBy('order.created_at', 'DESC');
        } else {
            query.orderBy('order.due_date', 'ASC');
        }

        const [orders, total] = await query
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const counts = await this.getOrderStatusCounts(tenantId, clientId);

        const data = await Promise.all(orders.map(async (order) => {
            const mapped = await this.mapOrderWithClient(order);
            const itemsCount = mapped.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)
                ?? order.items?.length
                ?? 0;

            return {
                id: mapped.id,
                reference: mapped.reference,
                client_name: mapped.client_name,
                client_phone: mapped.client_phone,
                items_count: itemsCount,
                items_summary: `${itemsCount} article${itemsCount > 1 ? 's' : ''}`,
                due_date: mapped.due_date,
                status: mapped.status,
                total_price: Number(mapped.total_price),
                amount_paid: Number(mapped.amount_paid || 0),
                payment_status: mapped.payment_status || PaymentStatus.UNPAID,
                balance_due: Number(mapped.total_price) - Number(mapped.amount_paid || 0),
                service_level: mapped.service_level,
                created_at: mapped.created_at,
                slot_label: mapped.slot_label,
                slot_type: mapped.slot_type,
                is_late:
                    mapped.due_date &&
                    new Date(mapped.due_date).getTime() < Date.now() &&
                    mapped.status !== OrderStatus.DELIVERED &&
                    mapped.status !== OrderStatus.CANCELLED,
            };
        }));

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                counts,
            },
        };
    }
}
