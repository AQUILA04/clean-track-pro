import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, ServiceLevel } from './entities/order.entity';
import { OrderStatus } from './enums/order-status.enum';
import { TenantService } from '../tenant/tenant.service';
import { PricingService } from '../catalog/services/pricing.service';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { DataSource } from 'typeorm';
import { StorageService } from '../storage/storage.service';
import { QuotaService } from '../subscription/services/quota.service';
import { Client } from '../clients/entities/client.entity';
import { Site } from '../sites/entities/site.entity';

describe('OrdersService', () => {
    let service: OrdersService;
    let tenantService: TenantService;
    let pricingService: PricingService;

    // Mock Managers and Repositories
    const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndMapOne: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
        getRawMany: jest.fn(),
        getCount: jest.fn(),
        getOne: jest.fn(),
        getMany: jest.fn(),
    };

    const mockOrderRepository = {
        create: jest.fn().mockImplementation((dto) => dto),
        save: jest.fn().mockImplementation((order) => Promise.resolve({ id: 'order-id', ...order })),
        findOne: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockClientRepository = {
        findOne: jest.fn(),
    };

    const mockSiteRepository = {
        findOne: jest.fn(),
    };

    const mockRefCountQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
    };

    const mockEntityManager = {
        create: jest.fn().mockImplementation((entity, dto) => dto),
        save: jest.fn().mockImplementation((entityOrTarget, maybeEntity?) => {
            const entity = maybeEntity !== undefined ? maybeEntity : entityOrTarget;
            if (Array.isArray(entity)) {
                return Promise.resolve(entity.map((e, i) => ({ ...e, id: `saved-id-${i}` })));
            }
            return Promise.resolve({ ...entity, id: 'saved-id' });
        }),
        findOne: jest.fn().mockResolvedValue({ id: 'site-1', code: 1, tenant_id: 'tenant-1' }),
        createQueryBuilder: jest.fn().mockReturnValue(mockRefCountQb),
    };

    const mockDataSource = {
        transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
        createQueryBuilder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            addGroupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([]),
        }),
    };

    const mockTenantService = {
        findOne: jest.fn(),
    };

    const mockPricingService = {
        getPrice: jest.fn(),
    };

    const mockStorageService = {
        getOrderStorageInfo: jest.fn().mockResolvedValue({
            slot_label: 'A-01',
            slot_type: 'RECEPTION',
            slot_id: 'slot-1',
        }),
        releaseOrder: jest.fn().mockResolvedValue(undefined),
    };

    const mockQuotaService = {
        assertWithinQuota: jest.fn().mockResolvedValue(undefined),
        recordUsage: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockEntityManager.findOne.mockResolvedValue({ id: 'site-1', code: 1, tenant_id: 'tenant-1' });
        mockEntityManager.createQueryBuilder.mockReturnValue(mockRefCountQb);
        mockRefCountQb.getCount.mockResolvedValue(0);
        mockEntityManager.create.mockImplementation((entity, dto) => dto);
        mockEntityManager.save.mockImplementation((entityOrTarget, maybeEntity?) => {
            const entity = maybeEntity !== undefined ? maybeEntity : entityOrTarget;
            if (Array.isArray(entity)) {
                return Promise.resolve(entity.map((e, i) => ({ ...e, id: `saved-id-${i}` })));
            }
            return Promise.resolve({ ...entity, id: 'saved-id' });
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                {
                    provide: getRepositoryToken(Order),
                    useValue: mockOrderRepository,
                },
                {
                    provide: getRepositoryToken(Client),
                    useValue: mockClientRepository,
                },
                {
                    provide: getRepositoryToken(Site),
                    useValue: mockSiteRepository,
                },
                {
                    provide: TenantService,
                    useValue: mockTenantService,
                },
                {
                    provide: PricingService,
                    useValue: mockPricingService,
                },
                {
                    provide: DataSource,
                    useValue: mockDataSource,
                },
                {
                    provide: StorageService,
                    useValue: mockStorageService,
                },
                {
                    provide: QuotaService,
                    useValue: mockQuotaService,
                },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        tenantService = module.get<TenantService>(TenantService);
        pricingService = module.get<PricingService>(PricingService);

        mockClientRepository.findOne.mockReset();
        mockClientRepository.findOne.mockResolvedValue(null);
    });

    it('should create order and match calculated price', async () => {
        mockTenantService.findOne.mockResolvedValue({ express_multiplier: 1.5 });
        mockPricingService.getPrice.mockResolvedValue(10.00); // Items are 10.00 each

        const itemDto: CreateOrderItemDto = {
            article_type_id: 'article-1',
            service_definition_id: 'service-1',
            quantity: 1,
            price: 10
        };

        const dto: CreateOrderDto = {
            site_id: 'site-1',
            client_id: 'client-1',
            due_date: new Date().toISOString(), // Will be ignored/recalculated
            status: OrderStatus.CREATED,
            service_level: ServiceLevel.EXPRESS,
            total_price: 15.00, // 10 * 1.5 = 15.00
            items: [itemDto]
        };

        const result = await service.create(dto, 'tenant-1');

        // Assertions
        expect(mockPricingService.getPrice).toHaveBeenCalledWith('tenant-1', 'article-1', 'service-1');
        expect(result.total_price).toBe(15.00);
        expect(mockEntityManager.save).toHaveBeenCalledTimes(2); // Order and Item (loop)
        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toEqual(expect.objectContaining({
            id: 'saved-id',
            article_type_id: 'article-1',
            service_definition_id: 'service-1',
        }));
    });

    it('should force calculated price if provided price is wrong', async () => {
        mockTenantService.findOne.mockResolvedValue({ express_multiplier: 1.0 });
        mockPricingService.getPrice.mockResolvedValue(10.00);

        const itemDto: CreateOrderItemDto = {
            article_type_id: 'article-1',
            service_definition_id: 'service-1',
            quantity: 2, // 2 * 10 = 20
            price: 10
        };

        const dto: CreateOrderDto = {
            site_id: 'site-1',
            client_id: 'client-1',
            due_date: new Date().toISOString(),
            status: OrderStatus.CREATED,
            service_level: ServiceLevel.NORMAL,
            total_price: 10.00, // WRONG, should be 20
            items: [itemDto]
        };

        const result = await service.create(dto, 'tenant-1');
        expect(result.total_price).toBe(20.00);
    });

    it('should throw error if no items provided', async () => {
        mockTenantService.findOne.mockResolvedValue({});
        const dto: CreateOrderDto = {
            site_id: 'site-1',
            client_id: 'client-1',
            due_date: new Date().toISOString(),
            total_price: 0,
            items: []
        };

        await expect(service.create(dto, 'tenant-1')).rejects.toThrow('Order must have items');
    });

    describe('findOne / lookup', () => {
        beforeEach(() => {
            mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
            mockQueryBuilder.getMany.mockResolvedValue([]);
        });

        it('should return order with client_name for full UUID', async () => {
            const order = {
                id: '03d05cdb-457d-4e14-adb0-f174f985ec82',
                tenant_id: 'tenant-1',
                client_id: 'client-1',
                client: { first_name: 'Jean', last_name: 'Dupont' },
                items: [],
            };
            mockQueryBuilder.getMany.mockResolvedValue([order]);

            const result = await service.findOne('03d05cdb-457d-4e14-adb0-f174f985ec82', 'tenant-1');

            expect(result.client_name).toBe('Jean Dupont');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.id = :id', {
                id: '03d05cdb-457d-4e14-adb0-f174f985ec82',
            });
        });

        it('should resolve client_name via client repository when join misses', async () => {
            const order = {
                id: '03d05cdb-457d-4e14-adb0-f174f985ec82',
                tenant_id: 'tenant-1',
                client_id: 'client-1',
                items: [],
            };
            mockQueryBuilder.getMany.mockResolvedValue([order]);
            mockClientRepository.findOne.mockResolvedValue({
                id: 'client-1',
                first_name: 'Awa',
                last_name: 'Diallo',
            });

            const result = await service.findOne('03d05cdb-457d-4e14-adb0-f174f985ec82', 'tenant-1');

            expect(result.client_name).toBe('Awa Diallo');
            expect(mockClientRepository.findOne).toHaveBeenCalledWith({ where: { id: 'client-1' } });
        });

        it('should find order by partial UUID prefix', async () => {
            const order = {
                id: '03d05cdb-457d-4e14-adb0-f174f985ec82',
                tenant_id: 'tenant-1',
                client: { first_name: 'Marie', last_name: 'Martin' },
                items: [],
            };
            mockQueryBuilder.getMany.mockResolvedValue([order]);

            const result = await service.findOne('03d05cdb', 'tenant-1');

            expect(result.client_name).toBe('Marie Martin');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('CAST(order.id AS TEXT) ILIKE'),
                expect.objectContaining({ uuidPrefix: '03d05cdb%' }),
            );
        });

        it('should throw when multiple orders match and findOne is used', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

            await expect(service.findOne('03d05cdb', 'tenant-1')).rejects.toThrow(
                'Multiple orders match this query',
            );
        });

        it('lookup should return multiple matches without throwing', async () => {
            const orders = [
                { id: 'a', reference: 'REF-01-2507-000136', client: { first_name: 'A', last_name: 'B' }, items: [] },
                { id: 'b', reference: 'REF-01-2507-000236', client: { first_name: 'C', last_name: 'D' }, items: [] },
            ];
            mockQueryBuilder.getMany.mockResolvedValue(orders);

            const result = await service.lookup('136', 'tenant-1');

            expect(result.count).toBe(2);
            expect(result.orders).toHaveLength(2);
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('order.reference ILIKE'),
                expect.objectContaining({ refFragment: '%136%' }),
            );
        });

        it('should throw for query too short', async () => {
            await expect(service.findOne('a', 'tenant-1')).rejects.toThrow('Query too short');
        });

        it('create should assign a reference', async () => {
            mockTenantService.findOne.mockResolvedValue({ express_multiplier: 1.0 });
            mockPricingService.getPrice.mockResolvedValue(10.0);
            mockRefCountQb.getCount.mockResolvedValue(135);

            const dto: CreateOrderDto = {
                site_id: 'site-1',
                client_id: 'client-1',
                due_date: new Date().toISOString(),
                status: OrderStatus.CREATED,
                service_level: ServiceLevel.NORMAL,
                total_price: 10,
                items: [{
                    article_type_id: 'article-1',
                    service_definition_id: 'service-1',
                    quantity: 1,
                    price: 10,
                }],
            };

            await service.create(dto, 'tenant-1');

            expect(mockEntityManager.create).toHaveBeenCalledWith(
                Order,
                expect.objectContaining({
                    reference: expect.stringMatching(/^REF-01-\d{4}-000136$/),
                }),
            );
        });
    });

    describe('updateStatus', () => {
        it('should update status for valid transition', async () => {
            mockOrderRepository.findOne.mockResolvedValue({
                id: 'order-1',
                tenant_id: 'tenant-1',
                client_id: 'client-1',
                status: OrderStatus.CREATED
            });
            mockOrderRepository.save.mockImplementation(o => Promise.resolve(o));
            mockClientRepository.findOne.mockResolvedValue({
                id: 'client-1',
                first_name: 'Jean',
                last_name: 'Dupont',
            });

            const result = await service.updateStatus('order-1', OrderStatus.IN_PROGRESS, 'tenant-1');
            expect(result.status).toBe(OrderStatus.IN_PROGRESS);
            expect(result.client_name).toBe('Jean Dupont');
            expect(mockOrderRepository.save).toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid transition', async () => {
            mockOrderRepository.findOne.mockResolvedValue({
                id: 'order-1',
                tenant_id: 'tenant-1',
                status: OrderStatus.CREATED
            });

            await expect(service.updateStatus('order-1', OrderStatus.DELIVERED, 'tenant-1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if order not found', async () => {
            mockOrderRepository.findOne.mockResolvedValue(null);

            await expect(service.updateStatus('order-1', OrderStatus.IN_PROGRESS, 'tenant-1'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('getDashboardStats', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        });

        it('should return aggregated stats for tenant', async () => {
            mockOrderRepository.count
                .mockResolvedValueOnce(5)  // ordersToday
                .mockResolvedValueOnce(3); // pendingOrders

            mockQueryBuilder.getRawOne.mockResolvedValue({ total: "150.50" });

            const result = await service.getDashboardStats('tenant-1');

            expect(result).toEqual({
                ordersToday: 5,
                revenueToday: 150.50,
                pendingOrders: 3
            });

            expect(mockOrderRepository.count).toHaveBeenCalledTimes(2);
            expect(mockOrderRepository.createQueryBuilder).toHaveBeenCalledWith('order');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('order.tenant_id = :tenantId', { tenantId: 'tenant-1' });
        });

        it('should handle zero revenue correctly', async () => {
            mockOrderRepository.count
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0);

            mockQueryBuilder.getRawOne.mockResolvedValue({ total: null });

            const result = await service.getDashboardStats('tenant-1');

            expect(result.revenueToday).toBe(0);
        });

        it('should filter by custom date range', async () => {
            const startDate = '2023-01-01';
            const endDate = '2023-01-31';

            mockOrderRepository.count
                .mockResolvedValueOnce(10)  // ordersToday
                .mockResolvedValueOnce(5);  // pendingOrders
            mockQueryBuilder.getRawOne.mockResolvedValue({ total: "1000.00" });

            const result = await service.getDashboardStats('tenant-1', 'UTC', startDate, endDate);

            // Verify all stats are returned
            expect(result).toEqual({
                ordersToday: 10,
                revenueToday: 1000.00,
                pendingOrders: 5
            });

            // Verify date filtering is applied to both count queries
            expect(mockOrderRepository.count).toHaveBeenCalledTimes(2);

            // Verify revenue query uses date range
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'order.created_at BETWEEN :start AND :end',
                expect.objectContaining({
                    start: expect.any(Date),
                    end: expect.any(Date)
                })
            );
        });

        it('should handle invalid date format gracefully', async () => {
            mockOrderRepository.count
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0);
            mockQueryBuilder.getRawOne.mockResolvedValue({ total: "0" });

            // Invalid date should still work (new Date('invalid') creates Invalid Date)
            // The service doesn't validate, so this tests current behavior
            const result = await service.getDashboardStats('tenant-1', 'UTC', 'invalid-date', '2023-01-31');

            expect(result).toBeDefined();
            expect(result.ordersToday).toBe(0);
        });

        it('should verify pendingOrders respects date range', async () => {
            const startDate = '2023-01-01';
            const endDate = '2023-01-31';

            mockOrderRepository.count
                .mockResolvedValueOnce(10)  // ordersToday
                .mockResolvedValueOnce(3);  // pendingOrders
            mockQueryBuilder.getRawOne.mockResolvedValue({ total: "500.00" });

            const result = await service.getDashboardStats('tenant-1', 'UTC', startDate, endDate);

            // Verify pendingOrders count was called twice (once for orders, once for pending)
            expect(mockOrderRepository.count).toHaveBeenCalledTimes(2);

            // The second call should include date filtering for pending orders
            const secondCall = mockOrderRepository.count.mock.calls[1][0];
            expect(secondCall.where).toHaveProperty('created_at');
            expect(result.pendingOrders).toBe(3);
        });

        it('should respect timezone for date calculations', async () => {
            mockOrderRepository.count.mockResolvedValue(5);
            mockQueryBuilder.getRawOne.mockResolvedValue({ total: "500.00" });

            // Test with Tokyo timezone (+09:00)
            await service.getDashboardStats('tenant-1', 'Asia/Tokyo');

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'order.created_at BETWEEN :start AND :end',
                expect.objectContaining({
                    start: expect.any(Date),
                    end: expect.any(Date)
                })
            );
        });
    });

    describe('getDelayedStats', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockOrderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
            mockQueryBuilder.getCount = jest.fn().mockResolvedValue(4);
        });

        it('should count active orders past due_date', async () => {
            const result = await service.getDelayedStats('tenant-1');
            expect(result).toEqual({ delayedOrders: 4 });
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'order.tenant_id = :tenantId',
                { tenantId: 'tenant-1' },
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'order.due_date < :now',
                expect.objectContaining({ now: expect.any(Date) }),
            );
        });

        it('should filter by siteId when provided', async () => {
            await service.getDelayedStats('tenant-1', 'site-9');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'order.site_id = :siteId',
                { siteId: 'site-9' },
            );
        });
    });
});
