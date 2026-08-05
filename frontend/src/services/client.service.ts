import { getSession } from 'next-auth/react';
import { getPublicApiUrl } from '@/lib/public-env';
import { ClientFormValues } from '../lib/validations/client';


const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const session = await getSession();
    const token = session?.accessToken;
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }
    return {};
};

export type ClientRecord = {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string | null;
    unique_code: string;
    notes?: string | null;
    site_id?: string | null;
    site_name?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type ClientListResponse = {
    data: ClientRecord[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

export const ClientService = {
    create: async (data: ClientFormValues): Promise<ClientRecord> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to create client');
        }

        return response.json();
    },

    update: async (id: string, data: Partial<ClientFormValues>): Promise<ClientRecord> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/clients/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update client');
        }

        return response.json();
    },

    getById: async (id: string): Promise<ClientRecord> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/clients/${id}`, {
            headers: authHeaders,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch client');
        }

        return response.json();
    },

    list: async (params?: {
        q?: string;
        page?: number;
        limit?: number;
    }): Promise<ClientListResponse> => {
        const authHeaders = await getAuthHeaders();
        const searchParams = new URLSearchParams();
        if (params?.q) searchParams.set('q', params.q);
        if (params?.page) searchParams.set('page', String(params.page));
        if (params?.limit) searchParams.set('limit', String(params.limit));

        const qs = searchParams.toString();
        const response = await fetch(`${getPublicApiUrl()}/clients${qs ? `?${qs}` : ''}`, {
            headers: authHeaders,
        });

        if (!response.ok) {
            throw new Error('Failed to list clients');
        }

        return response.json();
    },

    search: async (query: string): Promise<ClientRecord[]> => {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/clients/search?q=${encodeURIComponent(query)}`, {
            headers: authHeaders,
        });

        if (!response.ok) {
            throw new Error('Failed to search clients');
        }

        return response.json();
    },
};
