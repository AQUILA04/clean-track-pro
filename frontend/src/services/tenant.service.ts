import { getPublicApiUrl } from '@/lib/public-env';

import { getSession } from 'next-auth/react';

export interface CreateTenantDto {
    name: string;
    subdomain: string;
    adminEmail?: string;
    mainAgency: {
        name: string;
        location?: string;
        city?: string;
        postal_code?: string;
        email?: string;
        phone?: string;
    };
}

export interface UpdateTenantDto {
    name?: string;
    is_active?: boolean;
}

export interface UpdateTenantBrandingDto {
    name?: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    address?: string | null;
    legal_id?: string | null;
    vat_number?: string | null;
}

export interface UpdateTenantConfigDto {
    express_multiplier: number;
    express_sla_hours: number;
    express_enabled: boolean;
    currency: string;
    weight_unit: string;
    express_visibility: {
        showTTC: boolean;
        allowDiscounts: boolean;
        showInventory: boolean;
    };
}

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    is_active: boolean;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    address?: string | null;
    legal_id?: string | null;
    vat_number?: string | null;
    express_multiplier: number;
    express_sla_hours: number;
    express_enabled: boolean;
    currency: string;
    weight_unit: string;
    express_visibility: {
        showTTC: boolean;
        allowDiscounts: boolean;
        showInventory: boolean;
    };
    created_at: string;
}

// Helper to get auth token
const getAuthHeaders = async () => {
    const session = await getSession();
    const token = session?.accessToken;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};


export const TenantService = {
    create: async (data: CreateTenantDto): Promise<Tenant> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const message = Array.isArray(errorBody?.message)
                ? errorBody.message.join(', ')
                : errorBody?.message ?? 'Échec de la création du tenant';
            throw new Error(message);
        }

        return response.json();
    },

    getAll: async (): Promise<Tenant[]> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tenants');
        }

        const res = await response.json();
        return Array.isArray(res) ? res : (res.data ?? []);
    },

    getById: async (id: string): Promise<Tenant> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants/${id}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tenant');
        }

        const res = await response.json();
        return res.data ?? res;
    },

    update: async (id: string, data: UpdateTenantDto): Promise<Tenant> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update tenant');
        }

        const res = await response.json();
        return res.data ?? res;
    },

    delete: async (id: string): Promise<void> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants/${id}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const message = errorBody?.message ?? 'Failed to delete tenant';
            throw new Error(message);
        }
    },

    setActive: async (id: string, isActive: boolean): Promise<Tenant> => {
        return TenantService.update(id, { is_active: isActive });
    },

    updateBranding: async (updateTenantBrandingDto: UpdateTenantBrandingDto): Promise<Tenant> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants/me`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(updateTenantBrandingDto),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const message = Array.isArray(errorBody?.message)
                ? errorBody.message.join(', ')
                : errorBody?.message ?? 'Échec de la mise à jour du branding';
            throw new Error(message);
        }

        const res = await response.json();
        return res.data ?? res;
    },

    updateConfig: async (updateTenantConfigDto: UpdateTenantConfigDto): Promise<Tenant> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants/me/config`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(updateTenantConfigDto),
        });

        if (!response.ok) {
            throw new Error('Failed to update config');
        }

        const res = await response.json();
        return res.data;
    },

    getCurrentTenant: async (): Promise<Tenant> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/tenants/me`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const message = Array.isArray(errorBody?.message)
                ? errorBody.message.join(', ')
                : errorBody?.message ?? `Failed to fetch tenant configuration: ${response.status}`;
            throw new Error(message);
        }

        const res = await response.json();
        return res.data;
    }
};
