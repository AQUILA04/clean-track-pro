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

describe('OrdersService', () => {
    let service: OrdersService;
    let tenantService: TenantService;
    let pricingService: PricingService;

    // Mock Managers and Repositories
    const mockOrderRepository = {
        create: jest.fn().mockImplementation((dto) => dto),
        save: jest.fn().mockImplementation((order) => Promise.resolve({ id: 'order-id', ...order })),
    };

    const mockEntityManager = {
        create: jest.fn().mockImplementation((entity, dto) => dto),
        save: jest.fn().mockImplementation((entityOrEntities) => {
            if (Array.isArray(entityOrEntities)) {
                return Promise.resolve(entityOrEntities);
            }
            return Promise.resolve({ id: 'saved-id', ...entityOrEntities });
        }),
    };

    const mockDataSource = {
        transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
    };

    const mockTenantService = {
        findOne: jest.fn(),
    };

    const mockPricingService = {
        getPrice: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                {
                    provide: getRepositoryToken(Order),
                    useValue: mockOrderRepository,
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
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        tenantService = module.get<TenantService>(TenantService);
        pricingService = module.get<PricingService>(PricingService);
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
    describe('updateStatus', () => {
        it('should update status for valid transition', async () => {
            mockOrderRepository.findOne = jest.fn().mockResolvedValue({
                id: 'order-1',
                tenant_id: 'tenant-1',
                status: OrderStatus.CREATED
            });
            mockOrderRepository.save = jest.fn().mockImplementation(o => Promise.resolve(o));

            const result = await service.updateStatus('order-1', OrderStatus.IN_PROGRESS, 'tenant-1');
            expect(result.status).toBe(OrderStatus.IN_PROGRESS);
            expect(mockOrderRepository.save).toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid transition', async () => {
            mockOrderRepository.findOne = jest.fn().mockResolvedValue({
                id: 'order-1',
                tenant_id: 'tenant-1',
                status: OrderStatus.CREATED
            });

            await expect(service.updateStatus('order-1', OrderStatus.DELIVERED, 'tenant-1'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if order not found', async () => {
            mockOrderRepository.findOne = jest.fn().mockResolvedValue(null);

            await expect(service.updateStatus('order-1', OrderStatus.IN_PROGRESS, 'tenant-1'))
                .rejects.toThrow(BadRequestException);
        });
    });
});
