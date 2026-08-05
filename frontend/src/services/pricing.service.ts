import axios from 'axios';
import { getPublicApiUrl } from '@/lib/public-env';
import { getSession } from 'next-auth/react';
import { ServicePrice, UpsertServicePriceDto } from '@/types/service-price';


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
        const response = await axios.get(`${getPublicApiUrl()}/catalog/prices`, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async upsert(data: UpsertServicePriceDto): Promise<ServicePrice> {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${getPublicApiUrl()}/catalog/prices`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async delete(articleTypeId: string, serviceDefinitionId: string): Promise<void> {
        const headers = await getAuthHeaders();
        await axios.delete(`${getPublicApiUrl()}/catalog/prices`, {
            headers,
            params: {
                article_type_id: articleTypeId,
                service_definition_id: serviceDefinitionId
            },
            withCredentials: true,
        });
    },
};
