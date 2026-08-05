import axios from 'axios';
import { getPublicApiUrl } from '@/lib/public-env';
import { getSession } from 'next-auth/react';


const getAuthHeaders = async () => {
    const session = await getSession();
    if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
};

export interface CreateServiceDto {
    label: string;
    description: string;
    icon?: string;
    color?: string;
}

export interface UpdateServiceDto {
    label?: string;
    description?: string;
    icon?: string;
    color?: string;
}

export interface LaundryServiceItem {
    id: string;
    name: string; // mapped from label
    label: string; // original
    description: string;
    icon: string;
    color?: string;
}

export const laundryServiceService = {
    async findAll(query?: string): Promise<LaundryServiceItem[]> {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${getPublicApiUrl()}/catalog/services`, {
            headers,
            params: { q: query },
            withCredentials: true,
        });
        return response.data.data.map((item: any) => ({
            ...item,
            name: item.label,
            icon: item.icon || 'Droplets', // Default icon
        }));
    },

    async create(data: CreateServiceDto): Promise<LaundryServiceItem> {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${getPublicApiUrl()}/catalog/services`, data, {
            headers,
            withCredentials: true,
        });
        const item = response.data.data;
        return {
            ...item,
            name: item.label,
            icon: item.icon || 'Droplets',
        };
    },

    async update(id: string, data: UpdateServiceDto): Promise<LaundryServiceItem> {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${getPublicApiUrl()}/catalog/services/${id}`, data, {
            headers,
            withCredentials: true,
        });
        const item = response.data.data;
        return {
            ...item,
            name: item.label,
            icon: item.icon || 'Droplets',
        };
    },

    async delete(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        await axios.delete(`${getPublicApiUrl()}/catalog/services/${id}`, {
            headers,
            withCredentials: true,
        });
    },
};
