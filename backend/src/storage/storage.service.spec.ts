import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StorageSlot, StorageSlotStatus } from './entities/storage-slot.entity';
import { RlsService } from '../shared/database/rls/rls.service';
import { Order } from '../orders/entities/order.entity';
import { OrderStorage } from './entities/order-storage.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

const mockRlsService = {
    wrapTransaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
    getTenantId: jest.fn().mockReturnValue('tenant-1'),
};

const mockManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

describe('StorageService', () => {
    let service: StorageService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StorageService,
                { provide: getRepositoryToken(StorageSlot), useValue: {} },
                { provide: RlsService, useValue: mockRlsService },
            ],
        }).compile();

        service = module.get<StorageService>(StorageService);
        jest.clearAllMocks();
    });

    describe('processDelivery', () => {
        it('should successfully deliver an order and free the slot', async () => {
            const orderId = 'order-1';
            const mockOrder = { id: orderId, status: OrderStatus.STORED };
            // Use type casting to Partial<OrderStorage> structure that matches relations query
            const mockAssignment = {
                order_id: orderId,
                shelf_slot: { id: 'slot-1', status: StorageSlotStatus.OCCUPIED }
            };

            mockManager.findOne
                .mockResolvedValueOnce(mockOrder) // 1. Check Order
                .mockResolvedValueOnce(mockAssignment); // 2. Find Assignment

            await service.processDelivery(orderId);

            // Verify Slot Update
            expect(mockAssignment.shelf_slot.status).toBe(StorageSlotStatus.FREE);
            expect(mockManager.save).toHaveBeenCalledWith(StorageSlot, mockAssignment.shelf_slot);

            // Verify Assignment Removal
            expect(mockManager.remove).toHaveBeenCalledWith(OrderStorage, mockAssignment);

            // Verify Order Update
            expect(mockOrder.status).toBe(OrderStatus.DELIVERED);
            expect(mockManager.save).toHaveBeenCalledWith(Order, mockOrder);
        });

        it('should throw NotFound if order does not exist', async () => {
            mockManager.findOne.mockResolvedValueOnce(null);
            await expect(service.processDelivery('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('should throw Conflict if order is already delivered', async () => {
            mockManager.findOne.mockResolvedValueOnce({ id: '1', status: OrderStatus.DELIVERED });
            await expect(service.processDelivery('1')).rejects.toThrow(ConflictException);
        });

        it('should throw BadRequest if order is not READY or STORED', async () => {
            mockManager.findOne.mockResolvedValueOnce({ id: '1', status: OrderStatus.IN_PROGRESS });
            await expect(service.processDelivery('1')).rejects.toThrow(BadRequestException);
        });
    });
});
