
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    const token = session?.accessToken;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export interface Site {
    id: string;
    name: string;
    location?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    tenant_id: string;
    logoUrl?: string;
}

export interface CreateSiteDto {
    name: string;
    location?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export const SiteService = {
    async getAll(search?: string): Promise<Site[]> {
        const headers = await getAuthHeaders();
        const url = new URL(`${API_URL}/sites`);
        if (search) {
            url.searchParams.append('search', search);
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch sites');
        }

        const res = await response.json();
        return res.data;
    },

    async getById(id: string): Promise<Site> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/sites/${id}`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch site with id ${id}`);
        }

        const res = await response.json();
        return res.data;
    },

    create: async (data: Partial<Site>): Promise<Site> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/sites`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create site');
        }

        const res = await response.json();
        return res.data;
    },

    update: async (id: string, data: Partial<Site>): Promise<Site> => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/sites/${id}`, {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to update site');
        }

        const res = await response.json();
        return res.data;
    },
};
