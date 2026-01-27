import axios from 'axios';
import { getSession } from 'next-auth/react';
import { ServicePrice, UpsertServicePriceDto } from '@/types/service-price';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
};

export const pricingService = {
    async findAll(): Promise<ServicePrice[]> {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/catalog/prices`, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async upsert(data: UpsertServicePriceDto): Promise<ServicePrice> {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/catalog/prices`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },
};
