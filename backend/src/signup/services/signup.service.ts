import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantSignupRequest } from '../entities/tenant-signup-request.entity';
import { SignupRequestStatus } from '../enums/signup-request-status.enum';
import { SubmitSignupDto } from '../dto/submit-signup.dto';
import { SubscriptionPlan } from '../../subscription/entities/subscription-plan.entity';
import { TenantService } from '../../tenant/tenant.service';
import { StripePaymentService } from './stripe-payment.service';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { BillingInterval } from '../../subscription/enums/usage-period.enum';

export interface SignupSubmitResult {
    requestId: string;
    status: SignupRequestStatus;
    requiresPayment: boolean;
    checkoutUrl?: string;
    message: string;
}

const YEARLY_DISCOUNT_RATE = 0.17;

@Injectable()
export class SignupService {
    private readonly logger = new Logger(SignupService.name);

    constructor(
        @InjectRepository(TenantSignupRequest)
        private readonly signupRepository: Repository<TenantSignupRequest>,
        @InjectRepository(SubscriptionPlan)
        private readonly planRepository: Repository<SubscriptionPlan>,
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        private readonly tenantService: TenantService,
        private readonly stripePaymentService: StripePaymentService,
    ) {}

    async listPublicPlans(): Promise<SubscriptionPlan[]> {
        return this.planRepository.find({
            where: { is_public: true, is_active: true },
            order: { price: 'ASC' },
        });
    }

    async listRequests(status?: SignupRequestStatus): Promise<TenantSignupRequest[]> {
        const where = status ? { status } : {};
        return this.signupRepository.find({
            where,
            relations: ['plan'],
            order: { created_at: 'DESC' },
        });
    }

    async submit(dto: SubmitSignupDto): Promise<SignupSubmitResult> {
        const plan = await this.planRepository.findOne({ where: { id: dto.plan_id, is_public: true, is_active: true } });
        if (!plan) {
            throw new BadRequestException('Plan invalide ou non disponible');
        }

        const subdomain = await this.resolveUniqueSubdomain(dto.subdomain ?? this.slugify(dto.organization_name));

        const existingEmail = await this.signupRepository.findOne({
            where: { admin_email: dto.admin_email, status: SignupRequestStatus.PENDING },
        });
        if (existingEmail) {
            throw new ConflictException('Une demande en attente existe déjà pour cet email');
        }

        const billingCycle = dto.billing_cycle === 'YEARLY' ? BillingInterval.YEARLY : BillingInterval.MONTHLY;

        const request = this.signupRepository.create({
            organization_name: dto.organization_name,
            agency_name: dto.agency_name,
            subdomain,
            admin_email: dto.admin_email,
            admin_first_name: dto.admin_first_name,
            admin_last_name: dto.admin_last_name,
            plan_id: plan.id,
            status: SignupRequestStatus.PENDING,
        });

        const saved = await this.signupRepository.save(request);

        if (!plan.is_free) {
            return this.initiatePaidSignup(saved, plan, billingCycle);
        }

        if (plan.auto_approve_signups) {
            await this.provisionTenant(saved.id);
            return {
                requestId: saved.id,
                status: SignupRequestStatus.COMPLETED,
                requiresPayment: false,
                message: 'Votre compte a été créé. Consultez votre email pour activer votre accès.',
            };
        }

        return {
            requestId: saved.id,
            status: SignupRequestStatus.PENDING,
            requiresPayment: false,
            message: 'Votre demande a été enregistrée. Notre équipe va la valider sous 24–48h.',
        };
    }

    async completePayment(sessionId: string): Promise<SignupSubmitResult> {
        const { paid, signupRequestId, billingCycle } = await this.stripePaymentService.verifyCheckoutSession(sessionId);
        if (!paid || !signupRequestId) {
            throw new BadRequestException('Paiement non confirmé');
        }

        const request = await this.signupRepository.findOne({
            where: { id: signupRequestId },
            relations: ['plan'],
        });
        if (!request) {
            throw new NotFoundException('Demande introuvable');
        }

        if (request.status === SignupRequestStatus.COMPLETED) {
            return {
                requestId: request.id,
                status: SignupRequestStatus.COMPLETED,
                requiresPayment: false,
                message: 'Compte déjà activé. Consultez votre email.',
            };
        }

        request.payment_reference = sessionId;
        request.payment_completed_at = new Date();
        await this.signupRepository.save(request);

        await this.provisionTenant(request.id, undefined, billingCycle === 'YEARLY' ? BillingInterval.YEARLY : BillingInterval.MONTHLY);

        return {
            requestId: request.id,
            status: SignupRequestStatus.COMPLETED,
            requiresPayment: false,
            message: 'Paiement confirmé. Votre compte a été créé. Consultez votre email.',
        };
    }

    async approve(requestId: string, reviewerId: string): Promise<TenantSignupRequest> {
        const request = await this.findRequestOrThrow(requestId);
        if (request.status !== SignupRequestStatus.PENDING) {
            throw new BadRequestException('Seules les demandes en attente peuvent être approuvées');
        }

        await this.provisionTenant(requestId, reviewerId);
        return this.findRequestOrThrow(requestId);
    }

    async reject(requestId: string, reviewerId: string, reason?: string): Promise<TenantSignupRequest> {
        const request = await this.findRequestOrThrow(requestId);
        if (request.status !== SignupRequestStatus.PENDING) {
            throw new BadRequestException('Seules les demandes en attente peuvent être refusées');
        }

        request.status = SignupRequestStatus.REJECTED;
        request.reviewed_by = reviewerId;
        request.reviewed_at = new Date();
        request.rejection_reason = reason ?? null;
        return this.signupRepository.save(request);
    }

    private async initiatePaidSignup(
        request: TenantSignupRequest,
        plan: SubscriptionPlan,
        billingCycle: BillingInterval,
    ): Promise<SignupSubmitResult> {
        if (!this.stripePaymentService.isConfigured()) {
            throw new BadRequestException(
                'Paiement en ligne non configuré. Contactez le support pour souscrire à ce plan.',
            );
        }

        if (!plan.stripe_price_id) {
            const monthlyPrice = Number(plan.price);
            const yearlyBase = monthlyPrice * 12;
            const yearlyDiscounted = yearlyBase * (1 - YEARLY_DISCOUNT_RATE);
            const effectivePrice = billingCycle === BillingInterval.YEARLY ? yearlyDiscounted : monthlyPrice;
            const priceInCents = Math.round(effectivePrice * 100);
            const billingCurrency = (plan.currency || 'EUR').toUpperCase() === 'USD' ? 'usd' : 'eur';
            const checkout = await this.stripePaymentService.createCheckoutSession({
                signupRequestId: request.id,
                planName: plan.name,
                priceInCents,
                currency: billingCurrency,
                customerEmail: request.admin_email,
                billingCycle,
            });

            request.status = SignupRequestStatus.PAYMENT_PENDING;
            request.payment_reference = checkout.sessionId;
            await this.signupRepository.save(request);

            return {
                requestId: request.id,
                status: SignupRequestStatus.PAYMENT_PENDING,
                requiresPayment: true,
                checkoutUrl: checkout.url,
                message: 'Redirection vers le paiement sécurisé.',
            };
        }

        throw new BadRequestException('Configuration Stripe incomplète pour ce plan');
    }

    private async provisionTenant(
        requestId: string,
        reviewerId?: string,
        billingInterval: BillingInterval = BillingInterval.MONTHLY,
    ): Promise<Tenant> {
        const request = await this.signupRepository.findOne({
            where: { id: requestId },
            relations: ['plan'],
        });
        if (!request) {
            throw new NotFoundException('Demande introuvable');
        }

        if (request.status === SignupRequestStatus.COMPLETED && request.tenant_id) {
            const existing = await this.tenantRepository.findOneBy({ id: request.tenant_id });
            if (existing) {
                return existing;
            }
        }

        const tenant = await this.tenantService.create(
            {
                name: request.organization_name,
                subdomain: request.subdomain,
                adminEmail: request.admin_email,
                mainAgency: { name: request.agency_name },
            },
            {
                adminFirstName: request.admin_first_name,
                adminLastName: request.admin_last_name,
                planId: request.plan_id,
                billingInterval,
            },
        );

        request.status = SignupRequestStatus.COMPLETED;
        request.tenant_id = tenant.id;
        request.reviewed_by = reviewerId ?? null;
        request.reviewed_at = new Date();
        await this.signupRepository.save(request);

        this.logger.log(`Provisioned tenant ${tenant.id} from signup request ${requestId}`);
        return tenant;
    }

    private async findRequestOrThrow(id: string): Promise<TenantSignupRequest> {
        const request = await this.signupRepository.findOne({ where: { id }, relations: ['plan'] });
        if (!request) {
            throw new NotFoundException('Demande introuvable');
        }
        return request;
    }

    private async resolveUniqueSubdomain(base: string): Promise<string> {
        let candidate = base.slice(0, 40);
        let suffix = 0;

        while (true) {
            const subdomain = suffix === 0 ? candidate : `${candidate}-${suffix}`;
            const tenantExists = await this.tenantRepository.findOne({ where: { subdomain } });
            const pendingExists = await this.signupRepository.findOne({
                where: [
                    { subdomain, status: SignupRequestStatus.PENDING },
                    { subdomain, status: SignupRequestStatus.PAYMENT_PENDING },
                ],
            });
            if (!tenantExists && !pendingExists) {
                return subdomain;
            }
            suffix += 1;
        }
    }

    private slugify(value: string): string {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40) || 'pressing';
    }
}
