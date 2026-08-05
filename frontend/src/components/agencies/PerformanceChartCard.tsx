'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { OrdersService } from '@/services/orders.service';
import { useParams } from 'next/navigation';
import { useFormatMoney } from '@/context/tenant-config.context';
import { ContentLoader } from '@/components/ui/loading';

interface WeeklyStat {
    name: string;
    revenue: number;
    orders: number;
}

interface PerformanceChartCardProps {
    siteId?: string;
}

export const PerformanceChartCard: React.FC<PerformanceChartCardProps> = ({ siteId: siteIdProp }) => {
    const params = useParams();
    const siteId = siteIdProp || (params?.id as string);
    const formatMoney = useFormatMoney();

    const [data, setData] = useState<WeeklyStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await OrdersService.getWeeklyStats(siteId);
                setData(Array.isArray(stats) ? stats : []);
            } catch (error) {
                console.error('Failed to fetch weekly stats', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (siteId) {
            setLoading(true);
            fetchStats();
        } else {
            setLoading(false);
        }
    }, [siteId]);

    if (loading) {
        return (
            <div className="bg-card rounded-xl border border-border h-[350px]">
                <ContentLoader label="Chargement du graphique…" />
            </div>
        );
    }

    return (
        <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-semibold text-foreground">Performance hebdomadaire</h3>
                <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors duration-150"
                >
                    7 derniers jours
                    <ChevronDown size={14} />
                </button>
            </div>

            <div className="h-[250px] w-full">
                {data.length === 0 || data.every((d) => d.revenue === 0) ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée de performance pour cette période.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: '1px solid #334155',
                                    background: '#1E293B',
                                    color: '#F8FAFC',
                                    boxShadow: 'none',
                                }}
                                labelStyle={{ color: '#94A3B8' }}
                                formatter={(value: number | undefined) => [formatMoney(value ?? 0), 'Revenus']}
                            />
                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill="#3B82F6" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-muted-foreground font-medium">Revenus</span>
                </div>
            </div>
        </div>
    );
};
