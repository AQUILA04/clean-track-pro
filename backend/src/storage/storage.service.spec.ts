import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StorageSlot, StorageSlotStatus, SlotType } from './entities/storage-slot.entity';
import { RlsService } from '../shared/database/rls/rls.service';
import { Order } from '../orders/entities/order.entity';
import { OrderStorage } from './entities/order-storage.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

const mockManager = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn((_entity, data) => data),
};

const mockRlsService = {
    wrapTransaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
    getTenantId: jest.fn().mockReturnValue('tenant-1'),
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
        mockRlsService.wrapTransaction.mockImplementation((cb) => cb(mockManager));
        mockRlsService.getTenantId.mockReturnValue('tenant-1');
        mockManager.create.mockImplementation((_entity, data) => data);
    });

    describe('processDelivery', () => {
        it('should successfully deliver an order and free the slot', async () => {
            const orderId = 'order-1';
            const mockOrder = {
                id: orderId,
                status: OrderStatus.STORED,
                payment_status: 'PAID',
                total_price: 100,
                amount_paid: 100,
            };
            const mockAssignment = {
                order_id: orderId,
                shelf_slot: { id: 'slot-1', status: StorageSlotStatus.OCCUPIED },
            };

            mockManager.findOne.mockResolvedValueOnce(mockOrder);
            mockManager.find.mockResolvedValueOnce([mockAssignment]);

            await service.processDelivery(orderId);

            expect(mockAssignment.shelf_slot.status).toBe(StorageSlotStatus.FREE);
            expect(mockManager.save).toHaveBeenCalledWith(StorageSlot, mockAssignment.shelf_slot);
            expect(mockManager.remove).toHaveBeenCalledWith(OrderStorage, [mockAssignment]);
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
            mockManager.findOne.mockResolvedValueOnce({
                id: '1',
                status: OrderStatus.IN_PROGRESS,
                payment_status: 'PAID',
            });
            await expect(service.processDelivery('1')).rejects.toThrow(BadRequestException);
        });
    });

    describe('getSlotContents', () => {
        it('should return slot with null order when empty', async () => {
            const slot = {
                id: 'slot-1',
                name: 'A-01',
                status: StorageSlotStatus.FREE,
                slot_type: SlotType.RECEPTION,
            };
            mockManager.findOne
                .mockResolvedValueOnce(slot)
                .mockResolvedValueOnce(null);

            const result = await service.getSlotContents('slot-1');

            expect(result.slot.name).toBe('A-01');
            expect(result.order).toBeNull();
        });

        it('should return order reference, client name and items', async () => {
            const slot = {
                id: 'slot-1',
                name: 'A-01',
                status: StorageSlotStatus.OCCUPIED,
                slot_type: SlotType.RECEPTION,
            };
            const order = {
                id: 'order-1',
                reference: 'CTP-001',
                status: OrderStatus.CREATED,
                client_id: 'client-1',
                items: [
                    {
                        id: 'item-1',
                        article_type_id: 'art-1',
                        service_definition_id: 'svc-1',
                        quantity: 2,
                        price: 15,
                    },
                ],
            };
            const client = {
                id: 'client-1',
                first_name: 'Marie',
                last_name: 'Curie',
                phone: '0612345678',
                unique_code: 'CLI00001',
            };

            mockManager.findOne
                .mockResolvedValueOnce(slot)
                .mockResolvedValueOnce({ order, shelf_slot_id: 'slot-1' })
                .mockResolvedValueOnce(client);

            // enrichOrderItems uses manager.find for ArticleType / ServiceDefinition
            mockManager.find
                .mockResolvedValueOnce([{ id: 'art-1', label: 'Chemise' }])
                .mockResolvedValueOnce([{ id: 'svc-1', label: 'Nettoyage à sec' }]);

            const result = await service.getSlotContents('slot-1');

            expect(result.order?.reference).toBe('CTP-001');
            expect(result.order?.client_name).toBe('Marie Curie');
            expect(result.order?.items).toHaveLength(1);
            expect(result.order?.items[0].article_label).toBe('Chemise');
            expect(result.order?.items[0].service_label).toBe('Nettoyage à sec');
        });

        it('should throw NotFound for unknown slot', async () => {
            mockManager.findOne.mockResolvedValueOnce(null);
            await expect(service.getSlotContents('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('assignOrderToSlot', () => {
        it('should free previous slot when reassigning to a new one', async () => {
            const order = { id: 'order-1', status: OrderStatus.CREATED };
            const previousSlot = { id: 'slot-old', status: StorageSlotStatus.OCCUPIED, name: 'A-01', slot_type: SlotType.RECEPTION };
            const newSlot = { id: 'slot-new', status: StorageSlotStatus.FREE, name: 'A-02', slot_type: SlotType.RECEPTION };
            const previousAssignment = {
                order_id: 'order-1',
                shelf_slot_id: 'slot-old',
                shelf_slot: previousSlot,
            };

            mockManager.findOne
                .mockResolvedValueOnce(order)
                .mockResolvedValueOnce(newSlot);
            mockManager.find.mockResolvedValueOnce([previousAssignment]);

            await service.assignOrderToSlot({ order_id: 'order-1', shelf_slot_id: 'slot-new' });

            expect(previousSlot.status).toBe(StorageSlotStatus.FREE);
            expect(mockManager.remove).toHaveBeenCalledWith(OrderStorage, previousAssignment);
            expect(newSlot.status).toBe(StorageSlotStatus.OCCUPIED);
            expect(mockManager.save).toHaveBeenCalledWith(OrderStorage, expect.objectContaining({
                order_id: 'order-1',
                shelf_slot_id: 'slot-new',
                tenant_id: 'tenant-1',
            }));
        });

        it('should no-op when already assigned to the same slot', async () => {
            const order = { id: 'order-1', status: OrderStatus.CREATED };
            mockManager.findOne.mockResolvedValueOnce(order);
            mockManager.find.mockResolvedValueOnce([
                { order_id: 'order-1', shelf_slot_id: 'slot-1', shelf_slot: { id: 'slot-1' } },
            ]);

            await service.assignOrderToSlot({ order_id: 'order-1', shelf_slot_id: 'slot-1' });

            expect(mockManager.remove).not.toHaveBeenCalled();
            expect(mockManager.save).not.toHaveBeenCalled();
        });
    });
});
