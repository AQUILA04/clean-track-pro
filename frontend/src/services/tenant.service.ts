
export interface CreateTenantDto {
    name: string;
    subdomain: string;
}

export interface UpdateTenantBrandingDto {
    name?: string;
    logoUrl?: string;
}

export interface UpdateTenantConfigDto {
    express_multiplier: number;
    express_sla_hours: number;
}

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    logoUrl?: string;
    express_multiplier: number;
    express_sla_hours: number;
    created_at: string;
}

// Helper to get auth token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Assuming token is stored here
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const TenantService = {
    create: async (data: CreateTenantDto): Promise<Tenant> => {
        const response = await fetch(`${API_URL}/tenants`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create tenant');
        }

        return response.json();
    },

    updateBranding: async (updateTenantBrandingDto: UpdateTenantBrandingDto): Promise<Tenant> => {
        const response = await fetch(`${API_URL}/tenants/me`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateTenantBrandingDto),
        });

        if (!response.ok) {
            throw new Error('Failed to update branding');
        }

        const res = await response.json();
        return res.data; // Response.builder returns { data: ... }
    },

    updateConfig: async (updateTenantConfigDto: UpdateTenantConfigDto): Promise<Tenant> => {
        const response = await fetch(`${API_URL}/tenants/me/config`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(updateTenantConfigDto),
        });

        if (!response.ok) {
            throw new Error('Failed to update config');
        }

        const res = await response.json();
        return res.data;
    },

    getCurrentTenant: async (): Promise<Tenant> => {
        const response = await fetch(`${API_URL}/tenants/me`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tenant configuration');
        }

        const res = await response.json();
        return res.data;
    }
};
