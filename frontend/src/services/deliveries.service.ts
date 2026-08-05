import { getSession } from 'next-auth/react';
import { getPublicApiUrl } from '@/lib/public-env';


const getAuthHeaders = async () => {
    const session = await getSession();
    const token = session?.accessToken;
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

export interface ReadyDeliveryItem {
    order_id: string;
    reference: string | null;
    client_name: string;
    delivery_address: string | null;
    delivery_phone: string | null;
    locality_id: string | null;
    locality_name: string | null;
    slot_label: string | null;
    due_date: string;
    total_price: number;
    payment_status: string;
}

export interface ReadyDeliveryGroup {
    locality_id: string | null;
    locality_name: string;
    orders: ReadyDeliveryItem[];
}

export const DeliveriesService = {
    async listReady(siteId?: string, localityId?: string): Promise<ReadyDeliveryGroup[]> {
        const headers = await getAuthHeaders();
        const url = new URL(`${getPublicApiUrl()}/deliveries/ready`);
        if (siteId) url.searchParams.set('siteId', siteId);
        if (localityId) url.searchParams.set('localityId', localityId);
        const response = await fetch(url.toString(), { headers });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to load deliveries');
        }
        return response.json();
    },

    async confirm(orderId: string): Promise<void> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/deliveries/${orderId}/confirm`, {
            method: 'POST',
            headers,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to confirm delivery');
        }
    },
};
