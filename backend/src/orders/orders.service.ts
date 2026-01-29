import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In } from 'typeorm';
import { Order, ServiceLevel } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { TenantService } from '../tenant/tenant.service';
import { PricingService } from '../catalog/services/pricing.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        private tenantService: TenantService,
        private pricingService: PricingService,
        private dataSource: DataSource
    ) { }

    async create(createOrderDto: CreateOrderDto, tenantId: string): Promise<Order> {
        this.logger.log(`Creating order for tenant ${tenantId}`);

        return await this.dataSource.transaction(async manager => {
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

            // 4. Create Order Entity
            const newOrder = manager.create(Order, {
                tenant_id: tenantId,
                site_id: createOrderDto.site_id,
                client_id: createOrderDto.client_id,
                status: OrderStatus.CREATED,
                service_level: isExpress ? ServiceLevel.EXPRESS : ServiceLevel.NORMAL,
                due_date: expectedDueDate,
                total_price: calculatedTotal,
                created_at: createdDate
            });

            // Save Order first to generate ID
            const savedOrder = await manager.save(newOrder);

            // 5. Associate and Save Items
            for (const item of orderItemsByEntity) {
                item.order = savedOrder;
                // Use manager to save items to ensure transaction scope
                await manager.save(OrderItem, item);
            }

            // Return full order
            return savedOrder;
        });
    }

    async updateStatus(id: string, newStatus: OrderStatus, tenantId: string): Promise<Order> {
        this.logger.log(`Updating status for order ${id} to ${newStatus} (Tenant: ${tenantId})`);

        const order = await this.ordersRepository.findOne({
            where: { id, tenant_id: tenantId }
        });

        if (!order) {
            throw new BadRequestException('Order not found or access denied.');
        }

        this.validateStatusTransition(order.status, newStatus);

        order.status = newStatus;
        return await this.ordersRepository.save(order);
    }

    private validateStatusTransition(current: OrderStatus, next: OrderStatus): void {
        const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.CREATED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
            [OrderStatus.IN_PROGRESS]: [OrderStatus.READY, OrderStatus.CANCELLED],
            [OrderStatus.READY]: [OrderStatus.STORED, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            [OrderStatus.STORED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            [OrderStatus.DELIVERED]: [],
            [OrderStatus.CANCELLED]: []
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
        endDate?: string
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

        // 1. Orders Today
        const ordersToday = await this.ordersRepository.count({
            where: {
                tenant_id: tenantId,
                created_at: Between(startPeriod, endPeriod)
            }
        });

        // 2. Revenue Today
        const revenueResult = await this.ordersRepository
            .createQueryBuilder('order')
            .select('SUM(order.total_price)', 'total')
            .where('order.tenant_id = :tenantId', { tenantId })
            .andWhere('order.created_at BETWEEN :start AND :end', { start: startPeriod, end: endPeriod })
            .getRawOne();

        const revenueToday = revenueResult && revenueResult.total ? parseFloat(revenueResult.total) : 0;

        // 3. Pending Orders (within the selected date range)
        const pendingOrders = await this.ordersRepository.count({
            where: {
                tenant_id: tenantId,
                status: In([OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.READY]),
                created_at: Between(startPeriod, endPeriod)
            }
        });

        return {
            ordersToday,
            revenueToday,
            pendingOrders
        };
    }

    async findAll(
        tenantId: string,
        page: number = 1,
        limit: number = 50,
        type: 'active' | 'all' = 'active'
    ): Promise<{ data: any[], meta: any }> {
        const skip = (page - 1) * limit;

        const query = this.ordersRepository.createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndMapOne('order.client', 'clients', 'client', 'client.id = order.client_id')
            .where('order.tenant_id = :tenantId', { tenantId });

        if (type === 'active') {
            // Filter for active orders: CREATED, IN_PROGRESS, READY
            query.andWhere('order.status IN (:...statuses)', {
                statuses: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.READY]
            });
        }

        // Sort by due_date ASC (most urgent first)
        query.orderBy('order.due_date', 'ASC');

        const [orders, total] = await query
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        // Map to DTO
        const data = orders.map(order => {
            // @ts-ignore
            const clientName = order.client ? `${order.client.first_name || ''} ${order.client.last_name || ''}`.trim() : 'Unknown';

            return {
                id: order.id,
                client_name: clientName,
                items_summary: `${order.items?.length || 0} items`,
                due_date: order.due_date,
                status: order.status,
                total_price: Number(order.total_price),
                service_level: order.service_level,
                created_at: order.created_at
            };
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
