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

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const StorageService = {
    getAll: async (siteId: string): Promise<StorageSlot[]> => {
        const response = await fetch(`${API_URL}/storage/slots?site_id=${siteId}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch slots');
        const res = await response.json();
        return res.data || res;
    },

    create: async (data: CreateStorageSlotDto): Promise<StorageSlot> => {
        const response = await fetch(`${API_URL}/storage/slots`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create slot');
        }
        const res = await response.json();
        return res.data || res;
    }
};
