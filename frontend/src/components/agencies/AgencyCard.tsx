'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MoreVertical, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useFormatMoney } from '@/context/tenant-config.context';

export interface Agency {
    id: string;
    name: string;
    city: string;
    postalCode: string;
    status: 'ACTIVE' | 'CLOSED' | 'MAINTENANCE';
    revenue: number;
    revenueTrend: number;
    orders: number;
    image?: string;
    managers: Array<{
        name: string;
        initials: string;
    }>;
}

interface AgencyCardProps {
    agency: Agency;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({ agency }) => {
    const formatMoney = useFormatMoney();

    return (
        <Card className="overflow-hidden border-border hover:border-primary/30 transition-all duration-200 group rounded-xl p-0">
            <div className="relative h-48 w-full bg-muted">
                {agency.image ? (
                    <img
                        src={agency.image}
                        alt={agency.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-border" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-4 right-4 flex gap-2">
                    <Badge status={agency.status} />
                    <button className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-md text-white transition-colors duration-150">
                        <MoreVertical size={16} />
                    </button>
                </div>

                <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg leading-tight mb-1">{agency.name}</h3>
                    <div className="flex items-center text-sm text-slate-200">
                        <MapPin size={14} className="mr-1" />
                        {agency.city}, {agency.postalCode}
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Revenu (J)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-foreground">
                                {formatMoney(agency.revenue)}
                            </span>
                            <span className={`text-xs font-semibold ${agency.revenueTrend >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                {agency.revenueTrend > 0 ? '+' : ''}{agency.revenueTrend}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Commandes</p>
                        <span className="text-2xl font-bold text-foreground">{agency.orders}</span>
                    </div>
                </div>

                <div className="h-px bg-border mb-4" />

                <div className="flex justify-between items-center">
                    <div className="flex -space-x-2">
                        {agency.managers.map((manager, index) => (
                            <div
                                key={index}
                                className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground uppercase"
                                title={manager.name}
                            >
                                {manager.initials}
                            </div>
                        ))}
                    </div>

                    <Link
                        href={`/agencies/${agency.id}`}
                        className="text-sm font-semibold text-primary hover:text-blue-400 flex items-center transition-colors duration-150"
                    >
                        Voir détails
                        <ArrowRight size={16} className="ml-1" />
                    </Link>
                </div>
            </div>
        </Card>
    );
};
