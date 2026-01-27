import axios from 'axios';
import { ArticleType, CreateArticleTypeDto, UpdateArticleTypeDto } from '../types/article-type';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'; // Adjust based on env

import { getSession } from 'next-auth/react';

const getAuthHeaders = async () => {
    const session = await getSession();
    if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
};

export const articleTypeService = {
    async findAll(): Promise<ArticleType[]> {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/article-types`, {
            headers,
            withCredentials: true, // If using cookies
        });
        return response.data.data;
    },

    async create(data: CreateArticleTypeDto): Promise<ArticleType> {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/article-types`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },

    async update(id: string, data: UpdateArticleTypeDto): Promise<ArticleType> {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${API_URL}/article-types/${id}`, data, {
            headers,
            withCredentials: true,
        });
        return response.data.data;
    },
};
