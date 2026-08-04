import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.accessToken}`,
    };
};

const extractErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message)
        ? body.message.join(', ')
        : (body?.message as string | undefined);
    return message ?? fallback;
};

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    billing_interval: string;
    is_public: boolean;
    is_active: boolean;
    is_free: boolean;
    auto_approve_signups: boolean;
    stripe_price_id?: string | null;
    limits: Record<string, unknown>;
    features: Record<string, boolean>;
    created_at: string;
}

export interface CreateSubscriptionPlanDto {
    name: string;
    price: number;
    currency?: 'EUR' | 'USD';
    billing_interval: 'MONTHLY' | 'YEARLY';
    is_public?: boolean;
    is_active?: boolean;
    is_free?: boolean;
    auto_approve_signups?: boolean;
    stripe_price_id?: string;
    limits: Record<string, unknown>;
    features?: Record<string, boolean>;
}

export interface UpdateSubscriptionPlanDto {
    name?: string;
    price?: number;
    currency?: 'EUR' | 'USD';
    billing_interval?: string;
    is_public?: boolean;
    is_active?: boolean;
    is_free?: boolean;
    auto_approve_signups?: boolean;
    stripe_price_id?: string | null;
    limits?: Record<string, unknown>;
    features?: Record<string, boolean>;
}

const unwrapPayload = (res: unknown): unknown => {
    if (res && typeof res === 'object' && 'data' in res && (res as { data: unknown }).data !== undefined) {
        return (res as { data: unknown }).data;
    }
    return res;
};

const normalizePlan = (raw: Record<string, unknown>): SubscriptionPlan => ({
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    price: Number(raw.price ?? 0),
    currency: String(raw.currency ?? 'EUR').toUpperCase(),
    billing_interval: String(raw.billing_interval ?? 'MONTHLY'),
    is_public: raw.is_public === undefined ? true : Boolean(raw.is_public),
    is_active: raw.is_active === undefined ? true : Boolean(raw.is_active),
    is_free: Boolean(raw.is_free),
    auto_approve_signups: Boolean(raw.auto_approve_signups),
    stripe_price_id: raw.stripe_price_id ? String(raw.stripe_price_id) : null,
    limits: (raw.limits as Record<string, unknown>) ?? {},
    features: (raw.features as Record<string, boolean>) ?? {},
    created_at: String(raw.created_at ?? ''),
});

/** Merge server plan onto previous state without letting blank defaults wipe known fields. */
export const mergePlanUpdate = (
    previous: SubscriptionPlan,
    updated: SubscriptionPlan,
    patch: UpdateSubscriptionPlanDto,
): SubscriptionPlan => {
    // Incomplete PATCH payloads (undefined DTO fields serialized away) must not replace identity fields
    if (!updated.name) {
        return {
            ...previous,
            ...patch,
            name: typeof patch.name === 'string' && patch.name.trim() ? patch.name : previous.name,
            price: patch.price !== undefined ? Number(patch.price) : previous.price,
            currency: patch.currency ?? previous.currency,
            limits: patch.limits ?? previous.limits,
            features: patch.features ?? previous.features,
        };
    }
    return { ...previous, ...updated };
};

export const SubscriptionService = {
    listPlans: async (): Promise<SubscriptionPlan[]> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/subscriptions/plans`, { headers });
        if (!response.ok) throw new Error(await extractErrorMessage(response, 'Impossible de charger les plans'));
        const res = await response.json();
        const data = unwrapPayload(res) as Array<Record<string, unknown>>;
        return data.map(normalizePlan);
    },

    createPlan: async (data: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/subscriptions/plans`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(await extractErrorMessage(response, 'Impossible de créer le plan'));
        const res = await response.json();
        return normalizePlan(unwrapPayload(res) as Record<string, unknown>);
    },

    updatePlan: async (id: string, data: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/subscriptions/plans/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(await extractErrorMessage(response, 'Impossible de mettre à jour le plan'));
        const res = await response.json();
        return normalizePlan(unwrapPayload(res) as Record<string, unknown>);
    },
};
