import { mergePlanUpdate, type SubscriptionPlan, type UpdateSubscriptionPlanDto } from '../subscription.service';

const basePlan: SubscriptionPlan = {
    id: 'plan-1',
    name: 'Free',
    price: 0,
    billing_interval: 'MONTHLY',
    is_public: true,
    is_active: true,
    is_free: true,
    auto_approve_signups: false,
    stripe_price_id: null,
    limits: { orders: {} },
    features: {},
    created_at: '2026-01-01T00:00:00.000Z',
};

describe('mergePlanUpdate', () => {
    it('keeps name and is_free when server response lost identity fields', () => {
        const brokenServerPlan: SubscriptionPlan = {
            ...basePlan,
            name: '',
            is_free: false,
            auto_approve_signups: true,
        };
        const patch: UpdateSubscriptionPlanDto = { auto_approve_signups: true };

        const merged = mergePlanUpdate(basePlan, brokenServerPlan, patch);

        expect(merged.name).toBe('Free');
        expect(merged.is_free).toBe(true);
        expect(merged.auto_approve_signups).toBe(true);
    });

    it('applies a complete server response', () => {
        const updated: SubscriptionPlan = {
            ...basePlan,
            name: 'Gratuit',
            price: 0,
            auto_approve_signups: true,
        };

        const merged = mergePlanUpdate(basePlan, updated, { name: 'Gratuit' });

        expect(merged.name).toBe('Gratuit');
        expect(merged.auto_approve_signups).toBe(true);
    });
});
