
export interface CreateTenantDto {
    name: string;
    subdomain: string;
}

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const TenantService = {
    create: async (data: CreateTenantDto): Promise<Tenant> => {
        const response = await fetch(`${API_URL}/tenants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to create tenant');
        }

        return response.json();
    },
};
