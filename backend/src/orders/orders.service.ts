import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, ServiceLevel } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        private tenantService: TenantService,
    ) { }

    async create(createOrderDto: CreateOrderDto, tenantId: string): Promise<Order> {
        this.logger.log(`Creating order for tenant ${tenantId}`);

        // 1. Fetch Tenant Config
        const tenant = await this.tenantService.findOne(tenantId);

        // 2. Verify Price Logic
        // Calculate Expected Price
        let calculatedTotal = createOrderDto.total_price;

        if (createOrderDto.items && createOrderDto.items.length > 0) {
            const itemsTotal = createOrderDto.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

            const isExpress = createOrderDto.service_level === ServiceLevel.EXPRESS;
            const multiplier = isExpress && tenant.express_multiplier ? Number(tenant.express_multiplier) : 1.0;

            const expectedTotal = Number((itemsTotal * multiplier).toFixed(2));
            const providedTotal = Number(createOrderDto.total_price); // Assuming 2 decimals

            // Allow small epsilon for floating point logic, though .toFixed(2) comparison is safer
            if (Math.abs(expectedTotal - providedTotal) > 0.05) {
                this.logger.warn(`Price Mismatch detected. Provided: ${providedTotal}, Calculated: ${expectedTotal}. overriding with calculated.`);
                calculatedTotal = expectedTotal; // CORRECT & RETURN strategy
            } else {
                this.logger.log(`Price Verified. Match.`);
            }
        } else {
            this.logger.warn('No items provided in order, skipping price verification.');
        }

        // 3. Due Date Verification
        const createdDate = new Date();
        const isExpress = createOrderDto.service_level === ServiceLevel.EXPRESS;
        const slaHours = isExpress ? (tenant.express_sla_hours || 24) : 48; // Standard SLA 48h hardcoded for now matching frontend default

        // Simple manual addHours logic since backend doesn't have date-fns yet (avoiding dependency add if possible for this fix)
        const expectedDueDate = new Date(createdDate.getTime() + (slaHours * 60 * 60 * 1000));

        // We will OVERRIDE the due_date to ensure consistency with backend rules
        const finalDueDate = expectedDueDate;

        // 4. Create Order
        const newOrder = this.ordersRepository.create({
            ...createOrderDto,
            tenant_id: tenantId,
            total_price: calculatedTotal,
            due_date: finalDueDate,
            created_at: createdDate
        });

        return this.ordersRepository.save(newOrder);
    }
}
