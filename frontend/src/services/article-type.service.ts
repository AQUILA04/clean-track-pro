import axios from 'axios';
import { getPublicApiUrl } from '@/lib/public-env';
import { CreateArticleTypeDto, UpdateArticleTypeDto } from '../types/article-type';
import { MOCK_ARTICLES } from '../data/mock-articles';
import type { ArticleType } from '../types/article-type';


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
        const response = await axios.get(`${getPublicApiUrl()}/article-types`, {
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
        const response = await axios.post(`${getPublicApiUrl()}/article-types`, data, {
            headers,
            withCredentials: true,
        });
        const item = response.data.data;
        return { ...item, name: item.label };
    },

    async update(id: string, data: UpdateArticleTypeDto): Promise<ArticleType> {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${getPublicApiUrl()}/article-types/${id}`, data, {
            headers,
            withCredentials: true,
        });
        const item = response.data.data;
        return { ...item, name: item.label };
    },

    async delete(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        await axios.delete(`${getPublicApiUrl()}/article-types/${id}`, {
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

export type { ArticleType } from '../types/article-type';
