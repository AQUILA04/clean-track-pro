import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CashRegisterSession } from './entities/cash-register-session.entity';
import { SessionStatus } from './enums/session-status.enum';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentMethod } from '../payments/enums/payment-method.enum';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class CashRegisterService {
    private readonly logger = new Logger(CashRegisterService.name);

    constructor(
        @InjectRepository(CashRegisterSession)
        private readonly sessionRepo: Repository<CashRegisterSession>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) {}

    async openSession(
        dto: OpenSessionDto,
        tenantId: string,
        userId: string,
        siteId: string,
    ): Promise<CashRegisterSession> {
        const existing = await this.sessionRepo.findOne({
            where: { operator_id: userId, tenant_id: tenantId, status: SessionStatus.OPEN },
        });
        if (existing) {
            throw new BadRequestException(
                'Vous avez déjà une session de caisse ouverte. Clôturez-la avant d\'en ouvrir une nouvelle.',
            );
        }

        const pendingRemit = await this.sessionRepo.findOne({
            where: { operator_id: userId, tenant_id: tenantId, status: SessionStatus.CLOSED },
        });
        if (pendingRemit) {
            throw new BadRequestException(
                'Vous avez une session clôturée en attente de versement. Versez la recette avant d\'ouvrir une nouvelle caisse.',
            );
        }

        const session = this.sessionRepo.create({
            tenant_id: tenantId,
            site_id: siteId,
            operator_id: userId,
            opening_balance: dto.opening_balance || 0,
            status: SessionStatus.OPEN,
        });
        const saved = await this.sessionRepo.save(session);
        this.logger.log(`Cash register session opened: ${saved.id} by ${userId}`);
        return saved;
    }

    async closeSession(
        dto: CloseSessionDto,
        tenantId: string,
        userId: string,
    ): Promise<CashRegisterSession> {
        const session = await this.sessionRepo.findOne({
            where: { operator_id: userId, tenant_id: tenantId, status: SessionStatus.OPEN },
        });
        if (!session) {
            throw new BadRequestException('Aucune session de caisse ouverte trouvée.');
        }

        // Recalculate expected_cash from actual payments
        const cashPayments = await this.paymentRepo
            .createQueryBuilder('p')
            .select('COALESCE(SUM(p.amount), 0)', 'total')
            .where('p.session_id = :sessionId', { sessionId: session.id })
            .andWhere('p.payment_method = :method', { method: PaymentMethod.CASH })
            .getRawOne();

        const expectedCash = parseFloat(cashPayments.total || '0');

        session.expected_cash = expectedCash;
        session.declared_cash = dto.declared_cash;
        session.discrepancy = Number((dto.declared_cash - expectedCash).toFixed(2));
        session.closed_at = new Date();
        session.closed_by = userId;
        session.status = SessionStatus.CLOSED;
        session.notes = dto.notes || null;

        const saved = await this.sessionRepo.save(session);
        this.logger.log(
            `Cash register session closed: ${saved.id}, expected: ${expectedCash}, declared: ${dto.declared_cash}, discrepancy: ${saved.discrepancy}`,
        );
        return saved;
    }

    async getCurrentSession(tenantId: string, userId: string): Promise<CashRegisterSession | null> {
        const open = await this.sessionRepo.findOne({
            where: { operator_id: userId, tenant_id: tenantId, status: SessionStatus.OPEN },
        });
        if (open) return open;

        // Keep closed sessions visible until remitted so the operator/admin can create the cash remittance.
        return this.sessionRepo.findOne({
            where: { operator_id: userId, tenant_id: tenantId, status: SessionStatus.CLOSED },
            order: { closed_at: 'DESC' },
        });
    }

    async getSessionById(id: string, tenantId: string): Promise<CashRegisterSession> {
        const session = await this.sessionRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        return session;
    }

    async getSessionSummary(id: string, tenantId: string) {
        const session = await this.getSessionById(id, tenantId);

        const payments = await this.paymentRepo.find({
            where: { session_id: id, tenant_id: tenantId },
            order: { created_at: 'ASC' },
        });

        const byMethod: Record<string, number> = {};
        let totalCollected = 0;
        for (const p of payments) {
            const amt = Number(p.amount);
            totalCollected += amt;
            byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + amt;
        }

        return {
            session,
            payments,
            summary: {
                total_collected: Number(totalCollected.toFixed(2)),
                by_method: byMethod,
                payment_count: payments.length,
            },
        };
    }

    async getSessions(
        tenantId: string,
        siteId?: string,
        date?: string,
        operatorId?: string,
    ): Promise<CashRegisterSession[]> {
        const where: any = { tenant_id: tenantId };
        if (siteId) where.site_id = siteId;
        if (operatorId) where.operator_id = operatorId;
        if (date) {
            const d = new Date(date);
            where.opened_at = Between(startOfDay(d), endOfDay(d));
        }

        return this.sessionRepo.find({
            where,
            order: { opened_at: 'DESC' },
        });
    }
}
