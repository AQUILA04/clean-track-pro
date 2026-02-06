'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { OrdersService } from '@/services/orders.service';
import { useParams } from 'next/navigation';

export const PerformanceChartCard = () => {
    const params = useParams(); // Get siteId from URL params if available
    const siteId = params?.id as string;

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            // If no siteId is present (e.g. global dashboard), we might want to support global stats or skip
            // For now, assuming this component is mostly used in Agency Details or context where siteId matters
            try {
                const stats = await OrdersService.getWeeklyStats(siteId);
                // Transform if necessary, backend returns { name, revenue, orders } which matches Recharts needs
                setData(stats);
            } catch (error) {
                console.error('Failed to fetch weekly stats', error);
            } finally {
                setLoading(false);
            }
        };

        if (siteId) {
            fetchStats();
        } else {
            // Optional: Fetch global stats if no siteId? Or just mock/empty?
            // For this task, we focus on Agency Page which has siteId.
            setLoading(false);
        }
    }, [siteId]);

    if (loading) {
        return <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 flex items-center justify-center h-[350px]">Chargement...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-gray-900">Performance hebdomadaire</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    7 derniers jours
                    <ChevronDown size={14} />
                </button>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`${value} €`, 'Revenus']}
                        />
                        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#1A5AD7" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-gray-600 font-medium">Revenus</span>
                </div>
                {/* Volume bar not displayed yet, maybe add multi-bar later */}
            </div>
        </div>
    );
};
