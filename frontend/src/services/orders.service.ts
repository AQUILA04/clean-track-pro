import axios from 'axios';
import { getSession } from 'next-auth/react';
import { CreateOrderDto } from '@/types/create-order.dto'; // I might need to create this type definition on frontend too

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    if (session?.accessToken) {
        return { Authorization: `Bearer ${session.accessToken}` };
    }
    return {};
};

export const OrdersService = {
    async create(data: CreateOrderDto) {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_URL}/orders`, data, {
            headers,
            withCredentials: true,
        });
        return response.data;
    },

    async getById(id: string) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/${id}`, {
            headers,
            withCredentials: true,
        });
        return response.data;
    },

    /**
     * Elastic lookup by UUID (partial/full) or human reference (e.g. 136, REF-01-2507-000136).
     * Returns { count, orders } — when count > 1 the UI should show a picker.
     */
    async lookup(
        q: string,
        options?: { statuses?: string[]; siteId?: string },
    ): Promise<{ count: number; orders: any[] }> {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/lookup`, {
            headers,
            params: {
                q,
                statuses: options?.statuses?.join(','),
                siteId: options?.siteId,
            },
            withCredentials: true,
        });
        return response.data;
    },

    async updateStatus(id: string, status: string) {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${API_URL}/orders/${id}/status`, { status }, {
            headers,
            withCredentials: true,
        });
        return response.data;
    },

    async getDashboardStats(startDate?: string, endDate?: string, timezone?: string, siteId?: string, serviceId?: string) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/dashboard`, {
            headers,
            params: { startDate, endDate, timezone, siteId, serviceId },
            withCredentials: true,
        });
        return response.data;
    },

    async findAll(
        page: number = 1,
        limit: number = 50,
        type: 'active' | 'all' = 'active',
        clientId?: string,
        options?: { status?: 'all' | 'ready' | 'processing' | 'late'; q?: string },
    ) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders`, {
            params: {
                page,
                limit,
                type,
                clientId,
                status: options?.status,
                q: options?.q,
            },
            headers,
            withCredentials: true,
        });
        return response.data;
    },

    async getWeeklyStats(siteId?: string) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/weekly`, {
            headers,
            params: { siteId },
            withCredentials: true,
        });
        return response.data;
    },

    async getStatsBySite(startDate?: string, endDate?: string, timezone?: string) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/by-site`, {
            headers,
            params: { startDate, endDate, timezone },
            withCredentials: true,
        });
        return response.data as Array<{
            siteId: string;
            siteName: string;
            revenue: number;
            orders: number;
            activeOrders: number;
        }>;
    },

    async getHourlyStats(siteId?: string, date?: string, timezone?: string) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/hourly`, {
            headers,
            params: {
                siteId,
                date,
                timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            withCredentials: true,
        });
        return response.data as Array<{ hour: number; label: string; orders: number }>;
    },

    async getDelayedStats(siteId?: string) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/delayed`, {
            headers,
            params: { siteId },
            withCredentials: true,
        });
        return response.data as { delayedOrders: number };
    },

    async getTimeseriesStats(
        startDate: string,
        endDate: string,
        options?: { siteId?: string; serviceId?: string; timezone?: string },
    ) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/timeseries`, {
            headers,
            params: {
                startDate,
                endDate,
                siteId: options?.siteId,
                serviceId: options?.serviceId,
                timezone: options?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            withCredentials: true,
        });
        return response.data as Array<{
            date: string;
            label: string;
            revenue: number;
            orders: number;
        }>;
    },

    async getThroughputStats(
        startDate?: string,
        endDate?: string,
        options?: { siteId?: string; serviceId?: string; timezone?: string },
    ) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/throughput`, {
            headers,
            params: {
                startDate,
                endDate,
                siteId: options?.siteId,
                serviceId: options?.serviceId,
                timezone: options?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            withCredentials: true,
        });
        return response.data as {
            avgHours: number;
            completionRate: number;
            completedCount: number;
            createdCount: number;
            delayedOrders: number;
        };
    },

    async getStatsByService(
        startDate?: string,
        endDate?: string,
        options?: { siteId?: string; timezone?: string },
    ) {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/orders/stats/by-service`, {
            headers,
            params: {
                startDate,
                endDate,
                siteId: options?.siteId,
                timezone: options?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            withCredentials: true,
        });
        return response.data as Array<{
            serviceId: string;
            label: string;
            orders: number;
            revenue: number;
        }>;
    },
};
