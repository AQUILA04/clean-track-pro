import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RemittancesService } from './remittances.service';
import { CashRemittance } from './entities/cash-remittance.entity';
import { SiteRemittance } from './entities/site-remittance.entity';
import { CashRegisterSession } from '../cash-register/entities/cash-register-session.entity';
import { SessionStatus } from '../cash-register/enums/session-status.enum';
import { RemittanceStatus } from './enums/remittance-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RemittancesService', () => {
    let service: RemittancesService;
    let mockCashRemittanceRepo: any;
    let mockSiteRemittanceRepo: any;
    let mockSessionRepo: any;

    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const siteId = 'site-1';
    const managerId = 'manager-1';

    beforeEach(async () => {
        mockCashRemittanceRepo = {
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn((data) => ({ ...data, id: 'cr-1' })),
            save: jest.fn((data) => Promise.resolve(data)),
        };

        mockSiteRemittanceRepo = {
            findOne: jest.fn(),
            find: jest.fn().mockResolvedValue([]),
            create: jest.fn((data) => ({ ...data, id: 'sr-1' })),
            save: jest.fn((data) => Promise.resolve(data)),
        };

        mockSessionRepo = {
            findOne: jest.fn(),
            save: jest.fn((data) => Promise.resolve(data)),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RemittancesService,
                { provide: getRepositoryToken(CashRemittance), useValue: mockCashRemittanceRepo },
                { provide: getRepositoryToken(SiteRemittance), useValue: mockSiteRemittanceRepo },
                { provide: getRepositoryToken(CashRegisterSession), useValue: mockSessionRepo },
            ],
        }).compile();

        service = module.get<RemittancesService>(RemittancesService);
    });

    describe('createCashRemittance', () => {
        it('should create a cash remittance for a closed session', async () => {
            mockSessionRepo.findOne.mockResolvedValueOnce({
                id: 'session-1',
                status: SessionStatus.CLOSED,
                operator_id: userId,
            });
            mockCashRemittanceRepo.findOne.mockResolvedValueOnce(null);

            const result = await service.createCashRemittance(
                { session_id: 'session-1', amount: 5000 },
                tenantId,
                userId,
                siteId,
            );

            expect(result).toBeDefined();
            expect(result.amount).toBe(5000);
        });

        it('should reject if session is not closed', async () => {
            mockSessionRepo.findOne.mockResolvedValueOnce({
                id: 'session-1',
                status: SessionStatus.OPEN,
                operator_id: userId,
            });

            await expect(
                service.createCashRemittance(
                    { session_id: 'session-1', amount: 5000 },
                    tenantId,
                    userId,
                    siteId,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject duplicate remittance for same session', async () => {
            mockSessionRepo.findOne.mockResolvedValueOnce({
                id: 'session-1',
                status: SessionStatus.CLOSED,
                operator_id: userId,
            });
            mockCashRemittanceRepo.findOne.mockResolvedValueOnce({ id: 'existing' });

            await expect(
                service.createCashRemittance(
                    { session_id: 'session-1', amount: 5000 },
                    tenantId,
                    userId,
                    siteId,
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('should auto-acknowledge when Admin_Site remits own session', async () => {
            mockSessionRepo.findOne
                .mockResolvedValueOnce({
                    id: 'session-1',
                    status: SessionStatus.CLOSED,
                    operator_id: userId,
                })
                .mockResolvedValueOnce({ id: 'session-1', status: SessionStatus.CLOSED });
            mockCashRemittanceRepo.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                    id: 'cr-1',
                    tenant_id: tenantId,
                    session_id: 'session-1',
                    status: RemittanceStatus.PENDING,
                    operator_id: userId,
                    amount: 5000,
                });

            const result = await service.createCashRemittance(
                { session_id: 'session-1', amount: 5000 },
                tenantId,
                userId,
                siteId,
                { autoAcknowledge: true },
            );

            expect(result.status).toBe(RemittanceStatus.ACKNOWLEDGED);
            expect(result.manager_id).toBe(userId);
            expect(mockSessionRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ status: SessionStatus.REMITTED }),
            );
        });
    });

    describe('acknowledgeCashRemittance', () => {
        it('should acknowledge a pending remittance', async () => {
            const remittance = {
                id: 'cr-1',
                tenant_id: tenantId,
                session_id: 'session-1',
                status: RemittanceStatus.PENDING,
            };
            mockCashRemittanceRepo.findOne.mockResolvedValueOnce(remittance);
            mockSessionRepo.findOne.mockResolvedValueOnce({ id: 'session-1', status: SessionStatus.CLOSED });

            const result = await service.acknowledgeCashRemittance('cr-1', tenantId, managerId);

            expect(result.status).toBe(RemittanceStatus.ACKNOWLEDGED);
            expect(result.manager_id).toBe(managerId);
        });

        it('should reject acknowledging non-pending remittance', async () => {
            mockCashRemittanceRepo.findOne.mockResolvedValueOnce({
                id: 'cr-1',
                status: RemittanceStatus.ACKNOWLEDGED,
            });

            await expect(
                service.acknowledgeCashRemittance('cr-1', tenantId, managerId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('createSiteRemittance', () => {
        it('should aggregate acknowledged cash remittances', async () => {
            mockCashRemittanceRepo.find.mockResolvedValueOnce([
                { id: 'cr-1', amount: 5000, site_remittance_id: null },
                { id: 'cr-2', amount: 3000, site_remittance_id: null },
            ]);

            const result = await service.createSiteRemittance(
                { site_id: siteId, period_start: '2026-07-01', period_end: '2026-07-15' },
                tenantId,
                managerId,
            );

            expect(result.total_amount).toBe(8000);
        });

        it('should reject if no cash remittances for period', async () => {
            mockCashRemittanceRepo.find.mockResolvedValueOnce([]);

            await expect(
                service.createSiteRemittance(
                    { site_id: siteId, period_start: '2026-07-01', period_end: '2026-07-15' },
                    tenantId,
                    managerId,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });
});
