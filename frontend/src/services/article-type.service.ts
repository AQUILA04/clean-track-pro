import axios from 'axios';
import { CreateArticleTypeDto, UpdateArticleTypeDto } from '../types/article-type';
import { MOCK_ARTICLES } from '../data/mock-articles';

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
    async findAll(query?: string): Promise<ArticleType[]> {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/article-types`, {
            headers,
            params: { q: query },
            withCredentials: true, // If using cookies
        });
        return response.data.data.map((item: any) => ({
            ...item,
            name: item.label,
        }));
    },

    async create(data: CreateArticleTypeDto): Promise<ArticleType> {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/article-types`, data, {
            headers,
            withCredentials: true,
        });
        const item = response.data.data;
        return { ...item, name: item.label };
    },

    async update(id: string, data: UpdateArticleTypeDto): Promise<ArticleType> {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${API_URL}/article-types/${id}`, data, {
            headers,
            withCredentials: true,
        });
        const item = response.data.data;
        return { ...item, name: item.label };
    },

    async delete(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_URL}/article-types/${id}`, {
            headers,
            withCredentials: true,
        });
    },

    async getMockArticles(): Promise<ArticleType[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_ARTICLES as ArticleType[]);
            }, 500);
        });
    }
};

export interface ArticleType {
    id: string;
    name: string;
    articleId: string; // Display ID e.g. ART-001
    category: string;
    icon?: string;
}
