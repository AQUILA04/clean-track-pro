
import { getSession } from 'next-auth/react';
import { MOCK_USERS } from '@/data/mock-users';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface InviteUserDto {
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    siteId?: string;
    agencyIds?: string[];
    tenantId?: string;
}

const getAuthHeaders = async () => {
    const session = await getSession();
    const token = session?.accessToken;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export interface User {
    id: string;
    username: string;
    email: string;
    enabled: boolean;
    role?: string;
    firstName?: string;
    lastName?: string;
    agencies?: Array<{ id: string; name: string }>;
    attributes?: {
        site_ids?: string[];
        tenant_id?: string[];
        role?: string[];
    };
    requiredActions?: string[];
}

export interface UpdateUserDto {
    role?: string;
    siteId?: string;
}

export const UserService = {
    inviteUser: async (data: InviteUserDto) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/users/invite`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to invite user');
        }

        return response.json();
    },

    getUsers: async (options?: { siteId?: string; tenantId?: string }): Promise<User[]> => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (options?.siteId) params.set('siteId', options.siteId);
        if (options?.tenantId) params.set('tenantId', options.tenantId);
        const query = params.toString();
        const url = query ? `${API_URL}/users?${query}` : `${API_URL}/users`;

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const res = await response.json();
        return res.data;
    },

    getMockUsers: async (): Promise<User[]> => {
        return MOCK_USERS as User[];
    },

    resendInvitation: async (userId: string, options?: { tenantId?: string }) => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (options?.tenantId) {
            params.set('tenantId', options.tenantId);
        }
        const query = params.toString();
        const url = query
            ? `${API_URL}/users/${userId}/resend-invitation?${query}`
            : `${API_URL}/users/${userId}/resend-invitation`;

        const response = await fetch(url, {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.message || "Échec du renvoi de l'invitation");
        }

        return response.json();
    },

    updateUser: async (userId: string, data: UpdateUserDto, options?: { tenantId?: string }) => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (options?.tenantId) {
            params.set('tenantId', options.tenantId);
        }
        const query = params.toString();
        const url = query ? `${API_URL}/users/${userId}?${query}` : `${API_URL}/users/${userId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.message || 'Échec de la mise à jour de l\'utilisateur');
        }

        return response.json();
    },

    deleteUser: async (userId: string, options?: { tenantId?: string }) => {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (options?.tenantId) {
            params.set('tenantId', options.tenantId);
        }
        const query = params.toString();
        const url = query ? `${API_URL}/users/${userId}?${query}` : `${API_URL}/users/${userId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.message || 'Échec de la suppression de l\'utilisateur');
        }

        return response.json();
    },
};
