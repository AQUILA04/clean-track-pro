import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        'Authorization': `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
    };
};

export interface CashRemittanceData {
    id: string;
    session_id: string;
    operator_id: string;
    manager_id: string | null;
    amount: number;
    status: 'PENDING' | 'ACKNOWLEDGED' | 'DISPUTED';
    acknowledged_at: string | null;
    manager_notes: string | null;
    created_at: string;
    session?: any;
}

export interface SiteRemittanceData {
    id: string;
    site_id: string;
    submitted_by: string;
    received_by: string | null;
    period_start: string;
    period_end: string;
    total_amount: number;
    status: 'PENDING' | 'ACKNOWLEDGED' | 'DISPUTED';
    acknowledged_at: string | null;
    notes: string | null;
    created_at: string;
}

export const RemittanceService = {
    createCashRemittance: async (sessionId: string, amount: number): Promise<CashRemittanceData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/remittances/cash`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ session_id: sessionId, amount }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create remittance');
        }
        return response.json();
    },

    acknowledgeCashRemittance: async (id: string, notes?: string) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/remittances/cash/${id}/acknowledge`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to acknowledge');
        }
        return response.json();
    },

    disputeCashRemittance: async (id: string, notes?: string) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/remittances/cash/${id}/dispute`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to dispute');
        }
        return response.json();
    },

    getCashRemittances: async (siteId?: string, status?: string): Promise<CashRemittanceData[]> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (siteId) params.set('site_id', siteId);
        if (status) params.set('status', status);
        const response = await fetch(`${API_URL}/remittances/cash?${params}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch cash remittances');
        return response.json();
    },

    createSiteRemittance: async (siteId: string, periodStart: string, periodEnd: string, notes?: string): Promise<SiteRemittanceData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/remittances/site`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ site_id: siteId, period_start: periodStart, period_end: periodEnd, notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create site remittance');
        }
        return response.json();
    },

    acknowledgeSiteRemittance: async (id: string, notes?: string) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/remittances/site/${id}/acknowledge`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to acknowledge');
        }
        return response.json();
    },

    disputeSiteRemittance: async (id: string, notes?: string) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/remittances/site/${id}/dispute`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to dispute');
        }
        return response.json();
    },

    getSiteRemittances: async (siteId?: string, status?: string): Promise<SiteRemittanceData[]> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (siteId) params.set('site_id', siteId);
        if (status) params.set('status', status);
        const response = await fetch(`${API_URL}/remittances/site?${params}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch site remittances');
        return response.json();
    },
};
