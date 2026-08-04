import { NotFoundException } from '@nestjs/common';
import { SubscriptionPlanService } from './subscription-plan.service';
import { BillingInterval } from '../enums/usage-period.enum';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

describe('SubscriptionPlanService', () => {
    const existingPlan: SubscriptionPlan = {
        id: 'plan-1',
        name: 'Free',
        price: 0,
        currency: 'EUR',
        billing_interval: BillingInterval.MONTHLY,
        is_public: true,
        is_active: true,
        is_free: true,
        auto_approve_signups: false,
        stripe_price_id: null,
        limits: {},
        features: {},
        created_at: new Date('2026-01-01'),
    };

    const createService = (plan: SubscriptionPlan | null = existingPlan) => {
        const saved: SubscriptionPlan[] = [];
        const planRepository = {
            findOne: jest.fn().mockResolvedValue(plan ? { ...plan } : null),
            save: jest.fn().mockImplementation(async (entity: SubscriptionPlan) => {
                saved.push({ ...entity });
                return entity;
            }),
        };

        const service = new SubscriptionPlanService(planRepository as never);
        return { service, planRepository, saved };
    };

    it('updates only provided fields and keeps name/is_free when toggling auto_approve', async () => {
        const { service, saved } = createService();

        // Mimics a class-transformer DTO instance with undefined optional fields
        const dto = {
            name: undefined,
            price: undefined,
            billing_interval: undefined,
            is_public: undefined,
            is_active: undefined,
            is_free: undefined,
            auto_approve_signups: true,
            stripe_price_id: undefined,
            limits: undefined,
            features: undefined,
        } as Partial<SubscriptionPlan>;

        const result = await service.update('plan-1', dto);

        expect(result.name).toBe('Free');
        expect(result.is_free).toBe(true);
        expect(result.auto_approve_signups).toBe(true);
        expect(saved[0].name).toBe('Free');
        expect(saved[0].is_free).toBe(true);
    });

    it('updates name and price when provided', async () => {
        const { service } = createService();

        const result = await service.update('plan-1', {
            name: 'Gratuit',
            price: 0,
        });

        expect(result.name).toBe('Gratuit');
        expect(result.price).toBe(0);
    });

    it('throws when plan is missing', async () => {
        const { service } = createService(null);
        await expect(service.update('missing', { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });
});
