"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { OrderTable } from '@/components/orders/OrderTable';
import { OrdersService } from '@/services/orders.service';

export default function ActiveOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
    });

    const fetchOrders = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const result = await OrdersService.findAll(page, 50, 'active');
            setOrders(result.data);
            setPagination({
                page: result.meta.page,
                limit: result.meta.limit,
                total: result.meta.total,
                totalPages: result.meta.totalPages
            });
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    const handlePageChange = (newPage: number) => {
        fetchOrders(newPage);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Active Orders</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage orders currently in progress. Prioritize based on due date.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => fetchOrders(pagination.page)}
                        className="p-2 text-gray-400 hover:text-gray-500"
                        title="Refresh"
                    >
                        {/* Simple refresh icon */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            <OrderTable
                orders={orders}
                loading={loading}
                pagination={{
                    ...pagination,
                    onPageChange: handlePageChange
                }}
            />
        </div>
    );
}
