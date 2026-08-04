import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { DeliveryMode } from '../orders/enums/delivery-mode.enum';
import { Locality } from '../localities/entities/locality.entity';
import { Client } from '../clients/entities/client.entity';
import { StorageService } from '../storage/storage.service';

export interface ReadyDeliveryItem {
    order_id: string;
    reference: string | null;
    client_name: string;
    delivery_address: string | null;
    delivery_phone: string | null;
    locality_id: string | null;
    locality_name: string | null;
    slot_label: string | null;
    due_date: Date;
    total_price: number;
    payment_status: string;
}

export interface ReadyDeliveryGroup {
    locality_id: string | null;
    locality_name: string;
    orders: ReadyDeliveryItem[];
}

@Injectable()
export class DeliveriesService {
    constructor(
        @InjectRepository(Order)
        private readonly ordersRepository: Repository<Order>,
        private readonly storageService: StorageService,
    ) {}

    async listReady(
        tenantId: string,
        siteId?: string,
        localityId?: string,
    ): Promise<ReadyDeliveryGroup[]> {
        const qb = this.ordersRepository
            .createQueryBuilder('o')
            .leftJoinAndMapOne('o.client', Client, 'c', 'c.id::text = o.client_id')
            .leftJoinAndMapOne(
                'o.locality',
                Locality,
                'l',
                'l.id = o.locality_id',
            )
            .where('o.tenant_id = :tenantId', { tenantId })
            .andWhere('o.delivery_mode = :mode', { mode: DeliveryMode.HOME_DELIVERY })
            .andWhere('o.status = :status', { status: OrderStatus.STORED })
            .orderBy('l.name', 'ASC')
            .addOrderBy('o.due_date', 'ASC');

        if (siteId) {
            qb.andWhere('o.site_id = :siteId', { siteId });
        }
        if (localityId) {
            qb.andWhere('o.locality_id = :localityId', { localityId });
        }

        const orders = (await qb.getMany()) as Array<
            Order & { client?: Client; locality?: Locality }
        >;

        const groups = new Map<string, ReadyDeliveryGroup>();

        for (const order of orders) {
            let slotLabel: string | null = null;
            try {
                const info = await this.storageService.getOrderStorageInfo(order.id);
                slotLabel = info.slot_label;
            } catch {
                slotLabel = null;
            }

            const key = order.locality_id ?? 'none';
            const localityName = order.locality?.name ?? 'Sans localite';
            if (!groups.has(key)) {
                groups.set(key, {
                    locality_id: order.locality_id,
                    locality_name: localityName,
                    orders: [],
                });
            }

            const client = order.client;
            groups.get(key)!.orders.push({
                order_id: order.id,
                reference: order.reference,
                client_name: client
                    ? `${client.first_name} ${client.last_name}`.trim()
                    : 'Client',
                delivery_address: order.delivery_address,
                delivery_phone: order.delivery_phone,
                locality_id: order.locality_id,
                locality_name: localityName,
                slot_label: slotLabel,
                due_date: order.due_date,
                total_price: Number(order.total_price),
                payment_status: order.payment_status,
            });
        }

        return Array.from(groups.values());
    }

    async confirmDelivery(orderId: string, tenantId: string): Promise<void> {
        const order = await this.ordersRepository.findOne({
            where: { id: orderId, tenant_id: tenantId },
        });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        if (order.delivery_mode !== DeliveryMode.HOME_DELIVERY) {
            throw new BadRequestException(
                'Only HOME_DELIVERY orders can be confirmed via deliveries API',
            );
        }
        await this.storageService.processDelivery(orderId);
    }
}
