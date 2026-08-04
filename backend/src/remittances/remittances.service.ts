import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CashRemittance } from './entities/cash-remittance.entity';
import { SiteRemittance } from './entities/site-remittance.entity';
import { RemittanceStatus } from './enums/remittance-status.enum';
import { CreateCashRemittanceDto } from './dto/create-cash-remittance.dto';
import { CreateSiteRemittanceDto } from './dto/create-site-remittance.dto';
import { CashRegisterSession } from '../cash-register/entities/cash-register-session.entity';
import { SessionStatus } from '../cash-register/enums/session-status.enum';

@Injectable()
export class RemittancesService {
    private readonly logger = new Logger(RemittancesService.name);

    constructor(
        @InjectRepository(CashRemittance)
        private readonly cashRemittanceRepo: Repository<CashRemittance>,
        @InjectRepository(SiteRemittance)
        private readonly siteRemittanceRepo: Repository<SiteRemittance>,
        @InjectRepository(CashRegisterSession)
        private readonly sessionRepo: Repository<CashRegisterSession>,
    ) {}

    async createCashRemittance(
        dto: CreateCashRemittanceDto,
        tenantId: string,
        userId: string,
        siteId: string,
        options?: { autoAcknowledge?: boolean },
    ): Promise<CashRemittance> {
        const session = await this.sessionRepo.findOne({
            where: { id: dto.session_id, tenant_id: tenantId },
        });
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        if (session.status !== SessionStatus.CLOSED) {
            throw new BadRequestException('La session doit être clôturée avant de pouvoir verser la recette.');
        }
        if (session.operator_id !== userId) {
            throw new BadRequestException('Vous ne pouvez verser que votre propre recette.');
        }

        const existing = await this.cashRemittanceRepo.findOne({
            where: { session_id: dto.session_id, tenant_id: tenantId },
        });
        if (existing) {
            throw new BadRequestException('Un versement a déjà été créé pour cette session.');
        }

        const remittance = this.cashRemittanceRepo.create({
            tenant_id: tenantId,
            site_id: siteId,
            session_id: dto.session_id,
            operator_id: userId,
            amount: dto.amount,
            status: RemittanceStatus.PENDING,
        });

        const saved = await this.cashRemittanceRepo.save(remittance);
        this.logger.log(`Cash remittance ${saved.id} created for session ${dto.session_id}`);

        // Solo Admin_Site operating the till: auto-acknowledge so funds are ready for site→tenant remittance.
        if (options?.autoAcknowledge) {
            return this.acknowledgeCashRemittance(
                saved.id,
                tenantId,
                userId,
                'Auto-validé (admin site opérateur)',
            );
        }

        return saved;
    }

    async acknowledgeCashRemittance(
        id: string,
        tenantId: string,
        managerId: string,
        notes?: string,
    ): Promise<CashRemittance> {
        const remittance = await this.cashRemittanceRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!remittance) throw new NotFoundException('Versement non trouvé');
        if (remittance.status !== RemittanceStatus.PENDING) {
            throw new BadRequestException('Ce versement a déjà été traité.');
        }

        remittance.status = RemittanceStatus.ACKNOWLEDGED;
        remittance.manager_id = managerId;
        remittance.acknowledged_at = new Date();
        remittance.manager_notes = notes || null;

        // Mark session as REMITTED
        const session = await this.sessionRepo.findOne({
            where: { id: remittance.session_id },
        });
        if (session) {
            session.status = SessionStatus.REMITTED;
            await this.sessionRepo.save(session);
        }

        return this.cashRemittanceRepo.save(remittance);
    }

    async disputeCashRemittance(
        id: string,
        tenantId: string,
        managerId: string,
        notes?: string,
    ): Promise<CashRemittance> {
        const remittance = await this.cashRemittanceRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!remittance) throw new NotFoundException('Versement non trouvé');
        if (remittance.status !== RemittanceStatus.PENDING) {
            throw new BadRequestException('Ce versement a déjà été traité.');
        }

        remittance.status = RemittanceStatus.DISPUTED;
        remittance.manager_id = managerId;
        remittance.manager_notes = notes || null;

        return this.cashRemittanceRepo.save(remittance);
    }

    async findCashRemittances(
        tenantId: string,
        siteId?: string,
        status?: RemittanceStatus,
    ): Promise<CashRemittance[]> {
        const where: any = { tenant_id: tenantId };
        if (siteId) where.site_id = siteId;
        if (status) where.status = status;
        return this.cashRemittanceRepo.find({
            where,
            order: { created_at: 'DESC' },
            relations: ['session'],
        });
    }

    async createSiteRemittance(
        dto: CreateSiteRemittanceDto,
        tenantId: string,
        managerId: string,
    ): Promise<SiteRemittance> {
        // Aggregate acknowledged cash remittances for the period
        const cashRemittances = await this.cashRemittanceRepo.find({
            where: {
                tenant_id: tenantId,
                site_id: dto.site_id,
                status: RemittanceStatus.ACKNOWLEDGED,
                site_remittance_id: null as any,
                created_at: Between(new Date(dto.period_start), new Date(dto.period_end + 'T23:59:59')),
            },
        });

        if (cashRemittances.length === 0) {
            throw new BadRequestException('Aucun versement opérateur trouvé pour cette période.');
        }

        const totalAmount = cashRemittances.reduce(
            (sum, cr) => sum + Number(cr.amount),
            0,
        );

        const siteRemittance = this.siteRemittanceRepo.create({
            tenant_id: tenantId,
            site_id: dto.site_id,
            submitted_by: managerId,
            period_start: new Date(dto.period_start),
            period_end: new Date(dto.period_end),
            total_amount: Number(totalAmount.toFixed(2)),
            notes: dto.notes,
            status: RemittanceStatus.PENDING,
        });
        const saved = await this.siteRemittanceRepo.save(siteRemittance);

        // Link cash remittances to this site remittance
        for (const cr of cashRemittances) {
            cr.site_remittance_id = saved.id;
            await this.cashRemittanceRepo.save(cr);
        }

        this.logger.log(
            `Site remittance ${saved.id} created: ${totalAmount} for period ${dto.period_start} - ${dto.period_end}`,
        );
        return saved;
    }

    async acknowledgeSiteRemittance(
        id: string,
        tenantId: string,
        adminId: string,
        notes?: string,
    ): Promise<SiteRemittance> {
        const remittance = await this.siteRemittanceRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!remittance) throw new NotFoundException('Versement non trouvé');
        if (remittance.status !== RemittanceStatus.PENDING) {
            throw new BadRequestException('Ce versement a déjà été traité.');
        }

        remittance.status = RemittanceStatus.ACKNOWLEDGED;
        remittance.received_by = adminId;
        remittance.acknowledged_at = new Date();
        if (notes) remittance.notes = notes;

        return this.siteRemittanceRepo.save(remittance);
    }

    async disputeSiteRemittance(
        id: string,
        tenantId: string,
        adminId: string,
        notes?: string,
    ): Promise<SiteRemittance> {
        const remittance = await this.siteRemittanceRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!remittance) throw new NotFoundException('Versement non trouvé');
        if (remittance.status !== RemittanceStatus.PENDING) {
            throw new BadRequestException('Ce versement a déjà été traité.');
        }

        remittance.status = RemittanceStatus.DISPUTED;
        remittance.received_by = adminId;
        if (notes) remittance.notes = notes;

        return this.siteRemittanceRepo.save(remittance);
    }

    async findSiteRemittances(
        tenantId: string,
        siteId?: string,
        status?: RemittanceStatus,
    ): Promise<SiteRemittance[]> {
        const where: any = { tenant_id: tenantId };
        if (siteId) where.site_id = siteId;
        if (status) where.status = status;
        return this.siteRemittanceRepo.find({
            where,
            order: { created_at: 'DESC' },
        });
    }
}
