import { getSession } from 'next-auth/react';
import { getPublicApiUrl } from '@/lib/public-env';
import { parseFetchError } from '@/lib/api-error';

export enum StorageSlotStatus {
    FREE = 'FREE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED',
}

export enum SlotType {
    RECEPTION = 'RECEPTION',
    DELIVERY = 'DELIVERY',
}

export interface StorageSlot {
    id: string;
    name: string;
    status: StorageSlotStatus;
    slot_type: SlotType;
    site_id: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateStorageSlotDto {
    name: string;
    site_id: string;
    status?: StorageSlotStatus;
    slot_type?: SlotType;
}

export interface SlotContentsItem {
    id: string;
    quantity: number;
    price: number;
    article_label: string | null;
    service_label: string | null;
}

export interface SlotContentsOrder {
    id: string;
    reference: string | null;
    status: string;
    client_name: string;
    client_phone: string | null;
    items: SlotContentsItem[];
}

export interface SlotContentsResponse {
    slot: {
        id: string;
        name: string;
        status: StorageSlotStatus;
        slot_type: SlotType;
    };
    order: SlotContentsOrder | null;
}

const getAuthHeaders = async () => {
    const session = await getSession();
    const token = session?.accessToken;
    return {
        'Authorization': `Bearer ${token}`,
    };
};

const getJsonAuthHeaders = async () => {
    const headers = await getAuthHeaders();
    return {
        ...headers,
        'Content-Type': 'application/json',
    };
};


export const StorageService = {
    getAll: async (siteId: string, slotType?: SlotType): Promise<StorageSlot[]> => {
        const headers = await getJsonAuthHeaders();
        const params = new URLSearchParams({ site_id: siteId });
        if (slotType) params.set('slot_type', slotType);
        const response = await fetch(`${getPublicApiUrl()}/storage/slots?${params}`, {
            method: 'GET',
            headers: headers,
        });
        if (!response.ok) throw new Error('Failed to fetch slots');
        const res = await response.json();
        return res.data || res;
    },

    getOccupancyBySite: async (): Promise<
        Array<{ siteId: string; total: number; occupied: number; rate: number }>
    > => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/storage/stats/occupancy`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch occupancy stats');
        const res = await response.json();
        return res.data || res;
    },

    getSlotContents: async (slotId: string): Promise<SlotContentsResponse> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/storage/slots/${slotId}/contents`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            throw new Error(await parseFetchError(response, 'Impossible de charger le contenu du rayon'));
        }
        const res = await response.json();
        return res.data || res;
    },

    create: async (data: CreateStorageSlotDto): Promise<StorageSlot> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/storage/slots`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create slot');
        }
        const res = await response.json();
        return res.data || res;
    },

    assignOrder: async (orderId: string, slotId: string): Promise<void> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/storage/assign`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ order_id: orderId, shelf_slot_id: slotId }),
        });
        if (!response.ok) {
            throw new Error(await parseFetchError(response, 'Impossible de ranger la commande dans ce rayon'));
        }
    },

    releaseOrder: async (orderId: string): Promise<void> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/storage/release/${orderId}`, {
            method: 'POST',
            headers: headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to release order from slot');
        }
    },

    lookupOrder: async (orderId: string): Promise<any> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/storage/lookup/${orderId}`, {
            method: 'GET',
            headers: headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to lookup order');
        }
        const res = await response.json();
        return res.data || res;
    },

    /**
     * Elastic storage lookup — returns { count, matches } for UUID/ref fragments.
     */
    lookupOrders: async (
        q: string,
        options?: { siteId?: string; statuses?: string[] },
    ): Promise<{ count: number; matches: any[] }> => {
        const headers = await getJsonAuthHeaders();
        const params = new URLSearchParams({ q });
        if (options?.siteId) params.set('siteId', options.siteId);
        if (options?.statuses?.length) params.set('statuses', options.statuses.join(','));
        const response = await fetch(`${getPublicApiUrl()}/storage/lookup?${params}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            throw new Error(await parseFetchError(response, 'Commande introuvable'));
        }
        const res = await response.json();
        return res.data || res;
    },

    deliverOrder: async (orderId: string): Promise<void> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${getPublicApiUrl()}/storage/deliver/${orderId}`, {
            method: 'POST',
            headers: headers,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to complete delivery');
        }
    },

    uploadFile: async (file: File): Promise<string> => {
        const headers = await getAuthHeaders();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${getPublicApiUrl()}/storage/upload`, {
            method: 'POST',
            headers: headers, // Do not set Content-Type for FormData, browser does it
            body: formData,
        });

        if (!response.ok) {
            throw new Error(await parseFetchError(response, 'Échec du téléversement du fichier'));
        }

        const res = await response.json();
        // Backend wraps payload: { statusCode, message, data: { url } }
        const url = res?.data?.url ?? res?.url;
        if (!url || typeof url !== 'string') {
            throw new Error('URL du fichier manquante dans la réponse serveur');
        }
        return url;
    }
};
