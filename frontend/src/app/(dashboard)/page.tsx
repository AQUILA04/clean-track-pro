'use client';

import React, { useEffect, useState } from 'react';
import { OrdersService } from '@/services/orders.service';
import { KPICard } from '@/components/dashboard/KPICard';
import { ShoppingBag, CreditCard, Clock } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        ordersToday: 0,
        revenueToday: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await OrdersService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
                setError('Failed to load dashboard statistics. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    label="Orders Today"
                    value={stats.ordersToday}
                    icon={<ShoppingBag size={24} />}
                />
                <KPICard
                    label="Revenue Today"
                    value={new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.revenueToday)}
                    icon={<CreditCard size={24} />}
                />
                <KPICard
                    label="Pending Orders"
                    value={stats.pendingOrders}
                    icon={<Clock size={24} />}
                />
            </div>
        </div>
    );
}
