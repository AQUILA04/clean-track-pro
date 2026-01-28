import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, ServiceLevel } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { TenantService } from '../tenant/tenant.service';
import { PricingService } from '../catalog/services/pricing.service';

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
}
