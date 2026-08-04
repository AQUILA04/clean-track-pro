'use client';

import React from 'react';
import { Wallet, ShoppingBag, Activity } from 'lucide-react';
import { useFormatMoney } from '@/context/tenant-config.context';

interface AgencyStatsRowProps {
    revenue: number;
    revenueTrend: number;
    activeOrders: number;
    occupancyRate: number;
}

export const AgencyStatsRow: React.FC<AgencyStatsRowProps> = ({
    revenue,
    revenueTrend,
    activeOrders,
    occupancyRate,
}) => {
    const formatMoney = useFormatMoney();
    const trendPositive = revenueTrend >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Revenue Card */}
            <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">CA du jour</span>
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Wallet className="h-5 w-5 text-primary" />
                    </div>
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                            {formatMoney(revenue)}
                        </span>
                        <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                trendPositive
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                            }`}
                        >
                            {trendPositive ? '↗' : '↘'} {trendPositive ? '+' : ''}
                            {revenueTrend}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Orders Card */}
            <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Commandes actives</span>
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-amber-400" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">{activeOrders}</span>
                    <span className="text-sm text-muted-foreground">en cours</span>
                </div>
            </div>

            {/* Occupancy Card */}
            <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Taux de remplissage</span>
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-foreground">{occupancyRate}%</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-200"
                            style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">Capacité</span>
                </div>
            </div>
        </div>
    );
};
