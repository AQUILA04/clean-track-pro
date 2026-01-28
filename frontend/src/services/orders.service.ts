import axios from 'axios';
import { getSession } from 'next-auth/react';
import { CreateOrderDto } from '@/types/create-order.dto'; // I might need to create this type definition on frontend too

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
};

export const OrdersService = {
    async create(data: CreateOrderDto) {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/orders`, data, {
            headers,
            withCredentials: true,
        });
        return response.data;
    },

    async getById(id: string) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/${id}`, {
            headers,
            withCredentials: true,
        });
        return response.data;
    },

    async updateStatus(id: string, status: string) {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${API_URL}/orders/${id}/status`, { status }, {
            headers,
            withCredentials: true,
        });
        return response.data;
    }
};
