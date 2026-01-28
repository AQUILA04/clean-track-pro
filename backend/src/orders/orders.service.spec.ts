import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, ServiceLevel } from './entities/order.entity';
import { TenantService } from '../tenant/tenant.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';

describe('OrdersService', () => {
    let service: OrdersService;
    let tenantService: TenantService;

    const mockOrderRepository = {
        create: jest.fn().mockImplementation((dto) => dto),
        save: jest.fn().mockImplementation((order) => Promise.resolve({ id: 'order-id', ...order })),
    };

    const mockTenantService = {
        findOne: jest.fn(),
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
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        tenantService = module.get<TenantService>(TenantService);
    });

    it('should create order and verify price (correct match)', async () => {
        mockTenantService.findOne.mockResolvedValue({ express_multiplier: 1.5 });

        // 10 * 1 = 10. Express 1.5x -> 15.
        const dto: CreateOrderDto = {
            site_id: 'site-1',
            client_id: 'client-1',
            due_date: new Date().toISOString(),
            status: OrderStatus.CREATED,
            service_level: ServiceLevel.EXPRESS,
            total_price: 15.00,
            items: [{ price: 10, quantity: 1 }]
        };

        const result = await service.create(dto, 'tenant-1');
        expect(result.total_price).toBe(15.00);
        expect(mockOrderRepository.save).toHaveBeenCalled();
    });

    it('should create order and CORRECT price if mismatch (too low)', async () => {
        mockTenantService.findOne.mockResolvedValue({ express_multiplier: 1.5 });

        // 10 * 1 = 10. Express 1.5x -> 15. Provided: 10.
        const dto: CreateOrderDto = {
            site_id: 'site-1',
            client_id: 'client-1',
            due_date: new Date().toISOString(),
            status: OrderStatus.CREATED,
            service_level: ServiceLevel.EXPRESS,
            total_price: 10.00, // INCORRECT
            items: [{ price: 10, quantity: 1 }]
        };

        const result = await service.create(dto, 'tenant-1');
        expect(result.total_price).toBe(15.00); // CORRECTED
    });

    it('should create order and CORRECT price if mismatch (too high)', async () => {
        mockTenantService.findOne.mockResolvedValue({ express_multiplier: 1.0 }); // Normal

        // 10 * 1 = 10. Normal -> 10. Provided: 20.
        const dto: CreateOrderDto = {
            site_id: 'site-1',
            client_id: 'client-1',
            due_date: new Date().toISOString(),
            status: OrderStatus.CREATED,
            service_level: ServiceLevel.NORMAL,
            total_price: 20.00, // INCORRECT
            items: [{ price: 10, quantity: 1 }]
        };

        const result = await service.create(dto, 'tenant-1');
        expect(result.total_price).toBe(10.00); // CORRECTED
    });
    it('should recalculate due_date based on SLA', async () => {
        mockTenantService.findOne.mockResolvedValue({ express_sla_hours: 24 }); // Express SLA

        const dto: CreateOrderDto = {
            site_id: 'site-1',
            client_id: 'client-1',
            due_date: '2025-01-01T00:00:00.000Z', // Fake old date provided by frontend
            status: OrderStatus.CREATED,
            service_level: ServiceLevel.EXPRESS,
            total_price: 10.00,
            items: [{ price: 10, quantity: 1 }] // 1.0 multiplier assumed if not set in mock
        };

        const result = await service.create(dto, 'tenant-1');

        // Backend uses new Date() internally, so result.due_date should be close to NOW + 24h
        const now = new Date().getTime();
        const expected = now + (24 * 60 * 60 * 1000);
        const actual = new Date(result.due_date).getTime();

        // Check if within 5 seconds (execution latency)
        expect(Math.abs(actual - expected)).toBeLessThan(5000);
    });
});
