import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
};

export const SiteService = {
    async getAll() {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/sites`, {
            headers,
            withCredentials: true,
        });
        return response.data;
    }
};
