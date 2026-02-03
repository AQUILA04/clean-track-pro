
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface InviteUserDto {
    email: string;
    role: string;
    agencyIds: string[];
}

const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

import { MOCK_USERS } from '../data/mock-users';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    agencies: { id: string; name: string }[];
    avatar?: string | null;
}

export const UserService = {
    inviteUser: async (data: InviteUserDto) => {
        const response = await fetch(`${API_URL}/users/invite`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to invite user');
        }


        return response.json();
    },

    getUsers: async (): Promise<User[]> => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const res = await response.json();
        return res.data;
    },

    getMockUsers: async (): Promise<User[]> => {
        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_USERS);
            }, 500);
        });
    }
};
