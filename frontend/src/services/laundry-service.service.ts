import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
        const response = await axios.get(`${API_URL}/catalog/services`, {
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
        const response = await axios.post(`${API_URL}/catalog/services`, data, {
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
        const response = await axios.patch(`${API_URL}/catalog/services/${id}`, data, {
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
        await axios.delete(`${API_URL}/catalog/services/${id}`, {
            headers,
            withCredentials: true,
        });
    },
};
