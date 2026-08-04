import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CashRegisterSession } from '../cash-register/entities/cash-register-session.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentPhase } from './enums/payment-phase.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { SessionStatus } from '../cash-register/enums/session-status.enum';
import { BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let mockManager: Partial<EntityManager>;
    let mockPaymentRepo: any;

    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const siteId = 'site-1';

    beforeEach(async () => {
        mockManager = {
            findOne: jest.fn(),
            create: jest.fn((entity, data) => ({ ...data, id: 'payment-1' })),
            save: jest.fn((entity, data) => Promise.resolve(data)),
        };

        mockPaymentRepo = {
            find: jest.fn().mockResolvedValue([]),
        };

        const mockDataSource = {
            transaction: jest.fn((cb) => cb(mockManager as EntityManager)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
    });

    it('should create a payment and update order', async () => {
        const order = {
            id: 'order-1',
            tenant_id: tenantId,
            total_price: 10000,
            amount_paid: 0,
            payment_status: PaymentStatus.UNPAID,
        };
        const session = {
            id: 'session-1',
            operator_id: userId,
            tenant_id: tenantId,
            status: SessionStatus.OPEN,
            expected_cash: 0,
        };

        (mockManager.findOne as jest.Mock)
            .mockResolvedValueOnce(order) // Order lookup
            .mockResolvedValueOnce(session); // Session lookup

        const result = await service.create(
            {
                order_id: 'order-1',
                amount: 5000,
                payment_method: PaymentMethod.CASH,
                payment_phase: PaymentPhase.AT_ORDER,
            },
            tenantId,
            userId,
            siteId,
        );

        expect(result).toBeDefined();
        expect(mockManager.save).toHaveBeenCalled();
        expect(order.amount_paid).toBe(5000);
        expect(order.payment_status).toBe(PaymentStatus.PARTIAL);
    });

    it('should reject payment exceeding balance due', async () => {
        const order = {
            id: 'order-1',
            tenant_id: tenantId,
            total_price: 10000,
            amount_paid: 9000,
            payment_status: PaymentStatus.PARTIAL,
        };
        const session = {
            id: 'session-1',
            operator_id: userId,
            tenant_id: tenantId,
            status: SessionStatus.OPEN,
            expected_cash: 0,
        };

        (mockManager.findOne as jest.Mock)
            .mockResolvedValueOnce(order)
            .mockResolvedValueOnce(session);

        await expect(
            service.create(
                {
                    order_id: 'order-1',
                    amount: 2000,
                    payment_method: PaymentMethod.CASH,
                    payment_phase: PaymentPhase.AT_ORDER,
                },
                tenantId,
                userId,
                siteId,
            ),
        ).rejects.toThrow(BadRequestException);
    });

    it('should reject payment without open session', async () => {
        const order = {
            id: 'order-1',
            tenant_id: tenantId,
            total_price: 10000,
            amount_paid: 0,
            payment_status: PaymentStatus.UNPAID,
        };

        (mockManager.findOne as jest.Mock)
            .mockResolvedValueOnce(order)
            .mockResolvedValueOnce(null); // No session

        await expect(
            service.create(
                {
                    order_id: 'order-1',
                    amount: 5000,
                    payment_method: PaymentMethod.CASH,
                    payment_phase: PaymentPhase.AT_ORDER,
                },
                tenantId,
                userId,
                siteId,
            ),
        ).rejects.toThrow(BadRequestException);
    });

    it('should set PAID status when full amount is paid', async () => {
        const order = {
            id: 'order-1',
            tenant_id: tenantId,
            total_price: 10000,
            amount_paid: 0,
            payment_status: PaymentStatus.UNPAID,
        };
        const session = {
            id: 'session-1',
            operator_id: userId,
            tenant_id: tenantId,
            status: SessionStatus.OPEN,
            expected_cash: 0,
        };

        (mockManager.findOne as jest.Mock)
            .mockResolvedValueOnce(order)
            .mockResolvedValueOnce(session);

        await service.create(
            {
                order_id: 'order-1',
                amount: 10000,
                payment_method: PaymentMethod.CASH,
                payment_phase: PaymentPhase.AT_ORDER,
            },
            tenantId,
            userId,
            siteId,
        );

        expect(order.payment_status).toBe(PaymentStatus.PAID);
        expect(order.amount_paid).toBe(10000);
    });

    it('should find payments by order', async () => {
        await service.findByOrder('order-1', tenantId);
        expect(mockPaymentRepo.find).toHaveBeenCalledWith({
            where: { order_id: 'order-1', tenant_id: tenantId },
            order: { created_at: 'ASC' },
        });
    });
});
