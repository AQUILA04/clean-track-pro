import React from 'react';
import { Card } from '@/components/ui/Card'; // Assuming we have a generic Card or just use div with styles
import { Wallet, ShoppingBag, Activity } from 'lucide-react';

interface AgencyStatsRowProps {
    revenue: number;
    revenueTrend: number;
    activeOrders: number;
    occupancyRate: number;
}

export const AgencyStatsRow: React.FC<AgencyStatsRowProps> = ({ revenue, revenueTrend, activeOrders, occupancyRate }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Revenue Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-500">CA du jour</span>
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Wallet className="h-5 w-5 text-primary" />
                    </div>
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">{revenue.toLocaleString('fr-FR')} €</span>
                        <span className={`text-sm font-semibold ${revenueTrend >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                            {revenueTrend > 0 ? '↗' : '↘'} {revenueTrend > 0 ? '+' : ''}{revenueTrend}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Orders Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-500">Commandes actives</span>
                    <div className="p-2 bg-orange-50 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-orange-500" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{activeOrders}</span>
                    <span className="text-sm text-gray-400">en cours</span>
                </div>
            </div>

            {/* Occupancy Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-500">Taux de remplissage</span>
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <Activity className="h-5 w-5 text-purple-500" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">{occupancyRate}%</span>

                    {/* Simple Progress Bar as visuals */}
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${occupancyRate}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">Capacité</span>
                </div>
            </div>
        </div>
    );
};
