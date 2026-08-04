import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterSession } from './entities/cash-register-session.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SessionStatus } from './enums/session-status.enum';
import { BadRequestException } from '@nestjs/common';

describe('CashRegisterService', () => {
    let service: CashRegisterService;
    let mockSessionRepo: any;
    let mockPaymentRepo: any;

    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const siteId = 'site-1';

    beforeEach(async () => {
        mockSessionRepo = {
            findOne: jest.fn(),
            create: jest.fn((data) => ({ ...data, id: 'session-1' })),
            save: jest.fn((data) => Promise.resolve(data)),
            find: jest.fn().mockResolvedValue([]),
        };

        mockPaymentRepo = {
            find: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getRawOne: jest.fn().mockResolvedValue({ total: '5000' }),
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CashRegisterService,
                { provide: getRepositoryToken(CashRegisterSession), useValue: mockSessionRepo },
                { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
            ],
        }).compile();

        service = module.get<CashRegisterService>(CashRegisterService);
    });

    it('should open a session', async () => {
        mockSessionRepo.findOne.mockResolvedValueOnce(null);

        const result = await service.openSession({ opening_balance: 1000 }, tenantId, userId, siteId);
        expect(result).toBeDefined();
        expect(mockSessionRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({ operator_id: userId, opening_balance: 1000 }),
        );
    });

    it('should reject opening a second session', async () => {
        mockSessionRepo.findOne.mockResolvedValueOnce({ id: 'existing', status: SessionStatus.OPEN });

        await expect(
            service.openSession({}, tenantId, userId, siteId),
        ).rejects.toThrow(BadRequestException);
    });

    it('should close a session with discrepancy calculation', async () => {
        const session = {
            id: 'session-1',
            operator_id: userId,
            tenant_id: tenantId,
            status: SessionStatus.OPEN,
            expected_cash: 0,
        };
        mockSessionRepo.findOne.mockResolvedValueOnce(session);

        const result = await service.closeSession({ declared_cash: 4500 }, tenantId, userId);

        expect(result.status).toBe(SessionStatus.CLOSED);
        expect(result.declared_cash).toBe(4500);
        expect(result.expected_cash).toBe(5000);
        expect(result.discrepancy).toBe(-500);
    });

    it('should reject closing without open session', async () => {
        mockSessionRepo.findOne.mockResolvedValueOnce(null);

        await expect(
            service.closeSession({ declared_cash: 5000 }, tenantId, userId),
        ).rejects.toThrow(BadRequestException);
    });

    it('should return current session', async () => {
        const session = { id: 'session-1', status: SessionStatus.OPEN };
        mockSessionRepo.findOne.mockResolvedValueOnce(session);

        const result = await service.getCurrentSession(tenantId, userId);
        expect(result).toEqual(session);
    });

    it('should return closed session awaiting remittance when no open session', async () => {
        const closed = { id: 'session-closed', status: SessionStatus.CLOSED };
        mockSessionRepo.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(closed);

        const result = await service.getCurrentSession(tenantId, userId);
        expect(result).toEqual(closed);
    });

    it('should reject opening when a closed session awaits remittance', async () => {
        mockSessionRepo.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 'closed-1', status: SessionStatus.CLOSED });

        await expect(
            service.openSession({}, tenantId, userId, siteId),
        ).rejects.toThrow(BadRequestException);
    });
});