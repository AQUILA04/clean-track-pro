const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface PublicPlan {
    id: string;
    name: string;
    price: number;
    /** Billing currency for Stripe: EUR | USD */
    currency?: string;
    billing_interval: string;
    is_free: boolean;
    limits?: Record<string, unknown>;
    features: Record<string, boolean>;
}

export interface SubmitSignupDto {
    organization_name: string;
    agency_name: string;
    admin_email: string;
    admin_first_name: string;
    admin_last_name: string;
    plan_id: string;
    subdomain?: string;
    billing_cycle?: 'MONTHLY' | 'YEARLY';
}

export interface SignupSubmitResult {
    requestId: string;
    status: string;
    requiresPayment: boolean;
    checkoutUrl?: string;
    message: string;
}

export interface SignupRequest {
    id: string;
    organization_name: string;
    agency_name: string;
    subdomain: string;
    admin_email: string;
    admin_first_name: string;
    admin_last_name: string;
    plan_id: string;
    plan?: PublicPlan;
    status: string;
    payment_reference?: string | null;
    tenant_id?: string | null;
    rejection_reason?: string | null;
    created_at: string;
}

export const SignupService = {
    listPublicPlans: async (): Promise<PublicPlan[]> => {
        const response = await fetch(`${API_URL}/signup/plans`);
        if (!response.ok) throw new Error('Impossible de charger les offres');
        const res = await response.json();
        return res.data ?? res;
    },

    submit: async (data: SubmitSignupDto): Promise<SignupSubmitResult> => {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            const message = Array.isArray(body?.message)
                ? body.message.join(', ')
                : typeof body?.message === 'string'
                  ? body.message
                  : body?.error;
            throw new Error(message || `Échec de la demande d'inscription (${response.status})`);
        }
        const res = await response.json();
        return res.data ?? res;
    },

    completeCheckout: async (sessionId: string): Promise<SignupSubmitResult> => {
        const response = await fetch(`${API_URL}/signup/checkout/complete?session_id=${encodeURIComponent(sessionId)}`);
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.message ?? 'Paiement non confirmé');
        }
        const res = await response.json();
        return res.data ?? res;
    },

    listRequests: async (status?: string): Promise<SignupRequest[]> => {
        const session = await (await import('next-auth/react')).getSession();
        const params = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/signup/requests${params}`, {
            headers: {
                Authorization: `Bearer ${session?.accessToken}`,
            },
        });
        if (!response.ok) throw new Error('Impossible de charger les demandes');
        const res = await response.json();
        return res.data ?? res;
    },

    approve: async (id: string): Promise<SignupRequest> => {
        const session = await (await import('next-auth/react')).getSession();
        const response = await fetch(`${API_URL}/signup/requests/${id}/approve`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session?.accessToken}`,
            },
        });
        if (!response.ok) throw new Error('Impossible d\'approuver la demande');
        const res = await response.json();
        return res.data ?? res;
    },

    reject: async (id: string, reason?: string): Promise<SignupRequest> => {
        const session = await (await import('next-auth/react')).getSession();
        const response = await fetch(`${API_URL}/signup/requests/${id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.accessToken}`,
            },
            body: JSON.stringify({ reason }),
        });
        if (!response.ok) throw new Error('Impossible de refuser la demande');
        const res = await response.json();
        return res.data ?? res;
    },
};
