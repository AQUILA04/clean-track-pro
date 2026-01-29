import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StorageSlot, StorageSlotStatus } from './entities/storage-slot.entity';
import { RlsService } from '../shared/database/rls/rls.service';
import { CreateStorageSlotDto } from './dto/create-storage-slot.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderStorage } from './entities/order-storage.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('StorageService', () => {
    let service: StorageService;
    let rlsService: RlsService;

    const mockManager = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockRepository = {
        // Repository methods if used directly, but we use manager via RLS
    };

    const mockRlsService = {
        wrapTransaction: jest.fn().mockImplementation(async (cb) => {
            return cb(mockManager);
        }),
        getTenantId: jest.fn().mockReturnValue('tenant-1'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StorageService,
                {
                    provide: getRepositoryToken(StorageSlot),
                    useValue: mockRepository,
                },
                {
                    provide: RlsService,
                    useValue: mockRlsService,
                },
            ],
        }).compile();

        service = module.get<StorageService>(StorageService);
        rlsService = module.get<RlsService>(RlsService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a storage slot using RLS transaction', async () => {
            const dto: CreateStorageSlotDto = { name: 'A-01', site_id: 'site-123' };
            const expectedSlot = {
                id: 'uuid',
                ...dto,
                status: StorageSlotStatus.FREE,
                tenant_id: 'tenant-1',
                created_at: new Date(),
                updated_at: new Date()
            };

            mockManager.create.mockReturnValue(expectedSlot);
            mockManager.save.mockResolvedValue(expectedSlot);

            const result = await service.create(dto);

            expect(rlsService.wrapTransaction).toHaveBeenCalled();
            expect(mockManager.create).toHaveBeenCalledWith(StorageSlot, dto);
            expect(mockManager.save).toHaveBeenCalledWith(StorageSlot, expectedSlot);
            expect(result).toEqual(expectedSlot);
        });
    });

    describe('findAll', () => {
        it('should return all slots for a site', async () => {
            const siteId = 'site-123';
            const expectedSlots = [{ id: '1', name: 'A-01', site_id: siteId }];

            mockManager.find.mockResolvedValue(expectedSlots);

            const result = await service.findAll(siteId);

            expect(rlsService.wrapTransaction).toHaveBeenCalled();
            expect(mockManager.find).toHaveBeenCalledWith(StorageSlot, { where: { site_id: siteId } });
            expect(result).toEqual(expectedSlots);
        });
    });

    describe('assignOrderToSlot', () => {
        const orderId = 'order-uuid';
        const slotId = 'slot-uuid';
        const dto = { order_id: orderId, shelf_slot_id: slotId };

        it('should successfuly assign a READY order to a FREE slot', async () => {
            const mockOrder = { id: orderId, status: OrderStatus.READY };
            const mockSlot = { id: slotId, status: StorageSlotStatus.FREE };
            const mockAssignment = { order_id: orderId, shelf_slot_id: slotId, tenant_id: 'tenant-1' };

            mockManager.findOne
                .mockResolvedValueOnce(mockOrder) // Order check
                .mockResolvedValueOnce(null)      // Idempotency check 
                .mockResolvedValueOnce(mockSlot); // Slot check

            mockManager.create.mockReturnValue(mockAssignment);

            await service.assignOrderToSlot(dto);

            expect(mockManager.save).toHaveBeenCalledTimes(3); // Assignment, Order update, Slot update
            // Verify Order Status Change
            expect(mockOrder.status).toBe(OrderStatus.STORED);
            // Verify Slot Status Change
            expect(mockSlot.status).toBe(StorageSlotStatus.OCCUPIED);
        });

        it('should be idempotent if already assigned to same slot', async () => {
            const mockOrder = { id: orderId, status: OrderStatus.READY };

            mockManager.findOne
                .mockResolvedValueOnce(mockOrder)
                .mockResolvedValueOnce({ order_id: orderId, shelf_slot_id: slotId }); // Found existing assignment

            await service.assignOrderToSlot(dto);

            expect(mockManager.save).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException if order not found', async () => {
            mockManager.findOne.mockResolvedValueOnce(null);

            await expect(service.assignOrderToSlot(dto)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if order is not READY or STORED', async () => {
            const mockOrder = { id: orderId, status: OrderStatus.CREATED };
            mockManager.findOne
                .mockResolvedValueOnce(mockOrder)
                .mockResolvedValueOnce(null);

            await expect(service.assignOrderToSlot(dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if slot not found', async () => {
            const mockOrder = { id: orderId, status: OrderStatus.READY };
            mockManager.findOne
                .mockResolvedValueOnce(mockOrder)
                .mockResolvedValueOnce(null) // idempotency
                .mockResolvedValueOnce(null); // slot

            await expect(service.assignOrderToSlot(dto)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if slot is not FREE', async () => {
            const mockOrder = { id: orderId, status: OrderStatus.READY };
            const mockSlot = { id: slotId, status: StorageSlotStatus.OCCUPIED };

            mockManager.findOne
                .mockResolvedValueOnce(mockOrder)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(mockSlot);

            await expect(service.assignOrderToSlot(dto)).rejects.toThrow(ConflictException);
        });

        it('should allow assigning an already STORED order to an additional FREE slot (Multi-Slot)', async () => {
            const secondSlotId = 'slot-2-uuid';
            const mockOrder = { id: orderId, status: OrderStatus.STORED }; // Already stored
            const mockSlot = { id: secondSlotId, status: StorageSlotStatus.FREE };
            const mockAssignment = { order_id: orderId, shelf_slot_id: secondSlotId, tenant_id: 'tenant-1' };
            const secondDto = { order_id: orderId, shelf_slot_id: secondSlotId };

            mockManager.findOne
                .mockResolvedValueOnce(mockOrder) // Order check
                .mockResolvedValueOnce(null)      // Idempotency check 
                .mockResolvedValueOnce(mockSlot); // Slot check

            mockManager.create.mockReturnValue(mockAssignment);

            await service.assignOrderToSlot(secondDto);

            // Order status is ALREADY STORED, so we expect:
            // 1. Assignment save
            // 2. Slot status update
            // We DO NOT expect Order status update save if logic optimization is in place, 
            // OR we expect it to "update" it to STORED again which is harmless.
            // Let's check logic:
            // "if (order.status === OrderStatus.READY) { ... save(order) }"
            // Since status is STORED, it should correct SKIPPING the order save.

            expect(mockManager.save).toHaveBeenCalledTimes(2); // Assignment + Slot update ONLY.
            expect(mockManager.save).toHaveBeenCalledWith(OrderStorage, mockAssignment);
            expect(mockManager.save).toHaveBeenCalledWith(StorageSlot, mockSlot);
            expect(mockSlot.status).toBe(StorageSlotStatus.OCCUPIED);
        });
    });
});
