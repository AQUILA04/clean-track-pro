import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
    const session = await getSession();
    return {
        'Authorization': `Bearer ${session?.accessToken}`,
        'Content-Type': 'application/json',
    };
};

export enum PaymentMethod {
    CASH = 'CASH',
    MOBILE_MONEY = 'MOBILE_MONEY',
    CARD = 'CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentPhase {
    AT_ORDER = 'AT_ORDER',
    AT_PICKUP = 'AT_PICKUP',
}

export interface CreatePaymentDto {
    order_id: string;
    amount: number;
    payment_method: PaymentMethod;
    payment_phase: PaymentPhase;
    reference?: string;
    notes?: string;
}

export const PaymentService = {
    create: async (data: CreatePaymentDto) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create payment');
        }
        return response.json();
    },

    getByOrder: async (orderId: string) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/payments?order_id=${orderId}`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) throw new Error('Failed to fetch payments');
        return response.json();
    },
};
