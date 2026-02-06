import { getSession } from 'next-auth/react';

export enum StorageSlotStatus {
    FREE = 'FREE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED',
}

export interface StorageSlot {
    id: string;
    name: string;
    status: StorageSlotStatus;
    site_id: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
}

export interface CreateStorageSlotDto {
    name: string;
    site_id: string;
    status?: StorageSlotStatus;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const StorageService = {
    getAll: async (siteId: string): Promise<StorageSlot[]> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${API_URL}/storage/slots?site_id=${siteId}`, {
            method: 'GET',
            headers: headers,
        });
        if (!response.ok) throw new Error('Failed to fetch slots');
        const res = await response.json();
        return res.data || res;
    },

    create: async (data: CreateStorageSlotDto): Promise<StorageSlot> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${API_URL}/storage/slots`, {
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
        const response = await fetch(`${API_URL}/storage/assign`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ order_id: orderId, shelf_slot_id: slotId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to assign order');
        }
    },

    lookupOrder: async (orderId: string): Promise<any> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${API_URL}/storage/lookup/${orderId}`, {
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

    deliverOrder: async (orderId: string): Promise<void> => {
        const headers = await getJsonAuthHeaders();
        const response = await fetch(`${API_URL}/storage/deliver/${orderId}`, {
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

        const response = await fetch(`${API_URL}/storage/upload`, {
            method: 'POST',
            headers: headers, // Do not set Content-Type for FormData, browser does it
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload file');
        }

        const res = await response.json();
        return res.url; // Assuming backend returns { url: "..." }
    }
};
