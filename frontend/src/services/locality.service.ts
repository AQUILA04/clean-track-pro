import { getSession } from 'next-auth/react';
import { getPublicApiUrl } from '@/lib/public-env';


const getAuthHeaders = async () => {
    const session = await getSession();
    const token = session?.accessToken;
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

export interface Locality {
    id: string;
    tenant_id: string;
    site_id: string;
    name: string;
    is_active: boolean;
}

export const LocalityService = {
    async list(siteId?: string, activeOnly = false): Promise<Locality[]> {
        const headers = await getAuthHeaders();
        const url = new URL(`${getPublicApiUrl()}/localities`);
        if (siteId) url.searchParams.set('siteId', siteId);
        if (activeOnly) url.searchParams.set('activeOnly', 'true');
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to load localities');
        }
        return response.json();
    },

    async create(data: { site_id: string; name: string }): Promise<Locality> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/localities`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to create locality');
        }
        return response.json();
    },

    async update(id: string, data: { name?: string; is_active?: boolean }): Promise<Locality> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/localities/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update locality');
        }
        return response.json();
    },

    async deactivate(id: string): Promise<Locality> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/localities/${id}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to deactivate locality');
        }
        return response.json();
    },
};
