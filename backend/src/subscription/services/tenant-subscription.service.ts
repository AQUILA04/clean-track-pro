import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { TenantSubscription } from '../entities/tenant-subscription.entity';
import { BillingInterval, SubscriptionStatus } from '../enums/usage-period.enum';

@Injectable()
export class TenantSubscriptionService {
    private readonly logger = new Logger(TenantSubscriptionService.name);

    constructor(
        @InjectRepository(TenantSubscription)
        private readonly subscriptionRepository: Repository<TenantSubscription>,
        @InjectRepository(SubscriptionPlan)
        private readonly planRepository: Repository<SubscriptionPlan>,
    ) {}

    async assignPlan(
        tenantId: string,
        planId: string,
        billingInterval: BillingInterval = BillingInterval.MONTHLY,
    ): Promise<TenantSubscription> {
        const plan = await this.planRepository.findOne({ where: { id: planId } });
        if (!plan) {
            throw new NotFoundException(`Subscription plan not found: ${planId}`);
        }

        const now = new Date();
        const periodEnd = this.resolvePeriodEnd(now, billingInterval);

        const existing = await this.subscriptionRepository.findOne({ where: { tenant_id: tenantId } });
        if (existing) {
            existing.plan_id = planId;
            existing.current_period_start = now;
            existing.current_period_end = periodEnd;
            return this.subscriptionRepository.save(existing);
        }

        const subscription = this.subscriptionRepository.create({
            tenant_id: tenantId,
            plan_id: planId,
            status: SubscriptionStatus.ACTIVE,
            current_period_start: now,
            current_period_end: periodEnd,
            custom_limits: {},
        });

        const saved = await this.subscriptionRepository.save(subscription);
        this.logger.log(`Assigned plan ${plan.name} to tenant ${tenantId}`);
        return saved;
    }

    async assignDefaultPlan(tenantId: string, planName = 'Starter'): Promise<TenantSubscription> {
        const plan = await this.planRepository.findOne({ where: { name: planName } });
        if (!plan) {
            throw new NotFoundException(`Subscription plan "${planName}" not found`);
        }

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const subscription = this.subscriptionRepository.create({
            tenant_id: tenantId,
            plan_id: plan.id,
            status: SubscriptionStatus.ACTIVE,
            current_period_start: now,
            current_period_end: periodEnd,
            custom_limits: {},
        });

        const saved = await this.subscriptionRepository.save(subscription);
        this.logger.log(`Assigned plan "${planName}" to tenant ${tenantId}`);
        return saved;
    }

    async findByTenantId(tenantId: string): Promise<TenantSubscription | null> {
        return this.subscriptionRepository.findOne({
            where: { tenant_id: tenantId },
            relations: ['plan'],
        });
    }

    private resolvePeriodEnd(start: Date, billingInterval: BillingInterval): Date {
        const end = new Date(start);
        if (billingInterval === BillingInterval.YEARLY) {
            end.setFullYear(end.getFullYear() + 1);
        } else {
            end.setMonth(end.getMonth() + 1);
        }
        return end;
    }
}
