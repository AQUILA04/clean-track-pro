
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface InviteUserDto {
    email: string;
    role: string;
    siteId: string;
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
    attributes?: {
        site_ids?: string[];
        tenant_id?: string[];
        role?: string[];
    };
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

    getUsers: async (siteId?: string): Promise<User[]> => {
        const headers = await getAuthHeaders();
        const url = siteId
            ? `${API_URL}/users?siteId=${siteId}`
            : `${API_URL}/users`;

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const res = await response.json();
        return res.data;
    }
};
