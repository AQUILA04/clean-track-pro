import { getSession } from 'next-auth/react';
import { getPublicApiUrl } from '@/lib/public-env';


const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        'Authorization': `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
    };
};

export interface CashRegisterSessionData {
    id: string;
    tenant_id: string;
    site_id: string;
    operator_id: string;
    opened_at: string;
    closed_at: string | null;
    status: 'OPEN' | 'CLOSED' | 'REMITTED';
    opening_balance: number;
    expected_cash: number;
    declared_cash: number | null;
    discrepancy: number | null;
    notes: string | null;
}

export interface SessionSummary {
    session: CashRegisterSessionData;
    payments: any[];
    summary: {
        total_collected: number;
        by_method: Record<string, number>;
        payment_count: number;
    };
}

export const CashRegisterService = {
    open: async (openingBalance: number = 0): Promise<CashRegisterSessionData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/cash-register/open`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ opening_balance: openingBalance }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to open session');
        }
        return response.json();
    },

    close: async (declaredCash: number, notes?: string): Promise<CashRegisterSessionData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/cash-register/close`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ declared_cash: declaredCash, notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to close session');
        }
        return response.json();
    },

    getCurrent: async (): Promise<CashRegisterSessionData | null> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/cash-register/current`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch current session');
        // NestJS returns an empty body when the controller yields `null`
        const text = await response.text();
        if (!text) return null;
        const data = JSON.parse(text);
        return data || null;
    },

    getSessions: async (siteId?: string, date?: string): Promise<CashRegisterSessionData[]> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (siteId) params.set('site_id', siteId);
        if (date) params.set('date', date);
        const response = await fetch(`${getPublicApiUrl()}/cash-register/sessions?${params}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    },

    getSessionSummary: async (id: string): Promise<SessionSummary> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/cash-register/sessions/${id}/summary`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch session summary');
        return response.json();
    },
};
