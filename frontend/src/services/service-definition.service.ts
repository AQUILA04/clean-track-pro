import axios from 'axios';
import { getPublicApiUrl } from '@/lib/public-env';
import { getSession } from 'next-auth/react';
import { ServiceDefinition, CreateServiceDefinitionDto, UpdateServiceDefinitionDto } from '@/types/service-definition';


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
        const response = await axios.get(`${getPublicApiUrl()}/catalog/services`, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async create(data: CreateServiceDefinitionDto): Promise<ServiceDefinition> {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${getPublicApiUrl()}/catalog/services`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async update(id: string, data: UpdateServiceDefinitionDto): Promise<ServiceDefinition> {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${getPublicApiUrl()}/catalog/services/${id}`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },
};
