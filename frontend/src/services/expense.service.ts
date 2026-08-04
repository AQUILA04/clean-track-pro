import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        Authorization: `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
    };
};

export type ExpenseTypeData = {
    id: string;
    tenant_id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    is_system?: boolean;
    created_at: string;
    updated_at: string;
};

export type ExpenseData = {
    id: string;
    tenant_id: string;
    site_id: string;
    expense_type_id: string;
    expense_type?: ExpenseTypeData;
    description: string;
    amount: number;
    expense_date: string;
    receipt_url: string | null;
    created_by: string;
    created_at: string;
};

export type CreateExpensePayload = {
    expense_type_id: string;
    description: string;
    amount: number;
    expense_date: string;
    receipt_url?: string;
    site_id?: string;
};

export type ExpenseListMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type ExpenseListResult = {
    data: ExpenseData[];
    meta: ExpenseListMeta;
};

export type ExpenseCategoryStat = {
    typeId: string;
    name: string;
    total: number;
    count: number;
};

export type ExpenseStatsResult = {
    total: number;
    count: number;
    byCategory: ExpenseCategoryStat[];
};

export type ExpenseListFilters = {
    siteId?: string;
    startDate?: string;
    endDate?: string;
    typeId?: string;
    page?: number;
    limit?: number;
};

export const ExpenseService = {
    listTypes: async (activeOnly = false): Promise<ExpenseTypeData[]> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (activeOnly) params.set('activeOnly', 'true');
        const response = await fetch(`${API_URL}/expenses/types?${params}`, { headers });
        if (!response.ok) throw new Error('Impossible de charger les types de dépenses');
        return response.json();
    },

    createType: async (name: string, description?: string): Promise<ExpenseTypeData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/expenses/types`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, description }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Échec de création du type');
        }
        return response.json();
    },

    updateType: async (
        id: string,
        data: { name?: string; description?: string; is_active?: boolean },
    ): Promise<ExpenseTypeData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/expenses/types/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Échec de mise à jour du type');
        }
        return response.json();
    },

    deactivateType: async (id: string): Promise<ExpenseTypeData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/expenses/types/${id}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Échec de désactivation du type');
        }
        return response.json();
    },

    list: async (filters?: ExpenseListFilters): Promise<ExpenseListResult> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (filters?.siteId) params.set('siteId', filters.siteId);
        if (filters?.startDate) params.set('startDate', filters.startDate);
        if (filters?.endDate) params.set('endDate', filters.endDate);
        if (filters?.typeId) params.set('typeId', filters.typeId);
        params.set('page', String(filters?.page ?? 1));
        params.set('limit', String(filters?.limit ?? 20));
        const response = await fetch(`${API_URL}/expenses?${params}`, { headers });
        if (!response.ok) throw new Error('Impossible de charger les dépenses');
        return response.json();
    },

    getTotal: async (filters?: {
        siteId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<ExpenseStatsResult> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (filters?.siteId) params.set('siteId', filters.siteId);
        if (filters?.startDate) params.set('startDate', filters.startDate);
        if (filters?.endDate) params.set('endDate', filters.endDate);
        const response = await fetch(`${API_URL}/expenses/stats/total?${params}`, { headers });
        if (!response.ok) throw new Error('Impossible de charger le total des dépenses');
        const res = await response.json();
        return {
            total: res.total ?? 0,
            count: res.count ?? 0,
            byCategory: res.byCategory ?? [],
        };
    },

    getTimeseries: async (filters: {
        siteId?: string;
        startDate: string;
        endDate: string;
    }): Promise<Array<{ date: string; label: string; total: number; count: number }>> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        params.set('startDate', filters.startDate);
        params.set('endDate', filters.endDate);
        if (filters.siteId) params.set('siteId', filters.siteId);
        const response = await fetch(`${API_URL}/expenses/stats/timeseries?${params}`, { headers });
        if (!response.ok) throw new Error('Impossible de charger la série des dépenses');
        return response.json();
    },

    create: async (payload: CreateExpensePayload): Promise<ExpenseData> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Échec de création de la dépense');
        }
        return response.json();
    },

    remove: async (id: string): Promise<void> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/expenses/${id}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Échec de suppression');
        }
    },
};
