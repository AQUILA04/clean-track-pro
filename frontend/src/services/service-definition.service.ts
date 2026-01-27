import axios from 'axios';
import { getSession } from 'next-auth/react';
import { ServiceDefinition, CreateServiceDefinitionDto, UpdateServiceDefinitionDto } from '@/types/service-definition';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
};

export const serviceDefinitionService = {
    async findAll(): Promise<ServiceDefinition[]> {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/catalog/services`, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async create(data: CreateServiceDefinitionDto): Promise<ServiceDefinition> {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/catalog/services`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async update(id: string, data: UpdateServiceDefinitionDto): Promise<ServiceDefinition> {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${API_URL}/catalog/services/${id}`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },
};
