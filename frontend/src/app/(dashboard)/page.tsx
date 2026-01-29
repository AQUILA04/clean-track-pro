'use client';

import React, { useEffect, useState } from 'react';
import { OrdersService } from '@/services/orders.service';
import { KPICard } from '@/components/dashboard/KPICard';
import { ShoppingBag, CreditCard, Clock, Calendar } from 'lucide-react';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [rangeLabel, setRangeLabel] = useState('Today');

    const [stats, setStats] = useState({
        ordersToday: 0,
        revenueToday: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await OrdersService.getDashboardStats(dateRange.startDate, dateRange.endDate);
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
                setError('Failed to load dashboard statistics. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [dateRange]);

    const handleQuickFilter = (days: number, label: string) => {
        const end = new Date();
        const start = days === 0 ? new Date() : subDays(new Date(), days);
        setDateRange({
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        });
        setRangeLabel(label);
    };

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleQuickFilter(0, 'Today')}
                        className={`px-3 py-1 rounded text-sm ${rangeLabel === 'Today' ? 'bg-[#1A5AD7] text-white' : 'bg-white text-gray-600 border'}`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => handleQuickFilter(7, 'Last 7 Days')}
                        className={`px-3 py-1 rounded text-sm ${rangeLabel === 'Last 7 Days' ? 'bg-[#1A5AD7] text-white' : 'bg-white text-gray-600 border'}`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => handleQuickFilter(30, 'Last 30 Days')}
                        className={`px-3 py-1 rounded text-sm ${rangeLabel === 'Last 30 Days' ? 'bg-[#1A5AD7] text-white' : 'bg-white text-gray-600 border'}`}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

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
