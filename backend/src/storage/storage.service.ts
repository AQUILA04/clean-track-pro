import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageSlot, StorageSlotStatus } from './entities/storage-slot.entity';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';
import { AssignOrderDto } from './dto/assign-order.dto';
import { OrderStorage } from './entities/order-storage.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { RlsService } from '../shared/database/rls/rls.service';

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
                if (error.code === '23505') { // Unique violation
                    throw new ConflictException('Slot with this name already exists in this site.');
                }
                throw error;
            }
        });
    }

    async findAll(siteId: string): Promise<StorageSlot[]> {
        return this.rls.wrapTransaction(async (manager) => {
            return manager.find(StorageSlot, {
                where: { site_id: siteId }
            });
        });
    }

    async assignOrderToSlot(dto: AssignOrderDto): Promise<void> {
        return this.rls.wrapTransaction(async (manager) => {
            // 1. Check Order
            const order = await manager.findOne(Order, { where: { id: dto.order_id } });
            if (!order) {
                throw new NotFoundException('Order not found');
            }

            // check idempotency early
            const existingAssignment = await manager.findOne(OrderStorage, {
                where: { order_id: dto.order_id, shelf_slot_id: dto.shelf_slot_id }
            });

            if (existingAssignment) {
                return; // Already assigned, idempotent success
            }

            if (order.status !== OrderStatus.READY && order.status !== OrderStatus.STORED) {
                throw new BadRequestException(`Order must be in READY or STORED status to be assigned (Current: ${order.status})`);
            }

            // 2. Check Slot
            const slot = await manager.findOne(StorageSlot, { where: { id: dto.shelf_slot_id } });
            if (!slot) {
                throw new NotFoundException('Storage slot not found');
            }

            if (slot.status !== StorageSlotStatus.FREE) {
                throw new ConflictException('Storage slot is not FREE');
            }

            // 3. Create Assignment
            const assignment = manager.create(OrderStorage, {
                order_id: dto.order_id,
                shelf_slot_id: dto.shelf_slot_id,
            });

            const tenantId = this.rls.getTenantId();
            if (tenantId) {
                assignment.tenant_id = tenantId;
            }

            await manager.save(OrderStorage, assignment);

            // 4. Update Order Status if needed
            if (order.status === OrderStatus.READY) {
                order.status = OrderStatus.STORED;
                // Update 'stored_at' logic? OrderStorage has stored_at. Order entity might not check that.
                await manager.save(Order, order);
            }

            // 5. Update Slot Status
            slot.status = StorageSlotStatus.OCCUPIED;
            await manager.save(StorageSlot, slot);
        });
    }
}
