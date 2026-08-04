import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    const token = session?.accessToken;
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

export interface PlatformNotificationSettings {
    id: string;
    sms_unit_price: number | null;
    currency: string;
}

export interface TenantNotificationConfig {
    notification_email_enabled: boolean;
    notification_sms_enabled: boolean;
    sms_unit_price: number | null;
    currency: string;
}

export const NotificationService = {
    async getPlatformSettings(): Promise<PlatformNotificationSettings> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/notifications/platform-settings`, { headers });
        if (!response.ok) throw new Error('Failed to load platform notification settings');
        return response.json();
    },

    async updatePlatformSettings(data: {
        sms_unit_price?: number | null;
        currency?: string;
    }): Promise<PlatformNotificationSettings> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/notifications/platform-settings`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update settings');
        }
        return response.json();
    },

    async getTenantConfig(): Promise<TenantNotificationConfig> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/notifications/tenant-config`, { headers });
        if (!response.ok) throw new Error('Failed to load notification config');
        return response.json();
    },

    async updateTenantConfig(data: {
        notification_email_enabled?: boolean;
        notification_sms_enabled?: boolean;
    }): Promise<unknown> {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/notifications/tenant-config`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update notification config');
        }
        return response.json();
    },
};
