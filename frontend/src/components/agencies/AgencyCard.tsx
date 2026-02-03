import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MoreVertical, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
    return (
        <Card className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group bg-white rounded-2xl">
            {/* Image & Header Section */}
            <div className="relative h-48 w-full bg-gray-100">
                {agency.image ? (
                    <img
                        src={agency.image}
                        alt={agency.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <Badge status={agency.status} className="shadow-sm" />
                    <button className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-md text-white transition-colors">
                        <MoreVertical size={16} />
                    </button>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg leading-tight mb-1">{agency.name}</h3>
                    <div className="flex items-center text-sm text-gray-200">
                        <MapPin size={14} className="mr-1" />
                        {agency.city}, {agency.postalCode}
                    </div>
                </div>
            </div>

            {/* Metrics Section */}
            <div className="p-5">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Revenu (J)</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                {agency.revenue.toLocaleString('fr-FR')} €
                            </span>
                            <span className={`text-xs font-semibold ${agency.revenueTrend >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                                {agency.revenueTrend > 0 ? '+' : ''}{agency.revenueTrend}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Commandes</p>
                        <span className="text-2xl font-bold text-gray-900">{agency.orders}</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 mb-4" />

                {/* Footer Section */}
                <div className="flex justify-between items-center">
                    {/* Avatars */}
                    <div className="flex -space-x-2">
                        {agency.managers.map((manager, index) => (
                            <div
                                key={index}
                                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600 uppercase"
                                title={manager.name}
                            >
                                {manager.initials}
                            </div>
                        ))}
                    </div>

                    {/* Action Link */}
                    <Link
                        href={`/agencies/${agency.id}`}
                        className="text-sm font-semibold text-primary hover:text-blue-700 flex items-center transition-colors"
                    >
                        Voir détails
                        <ArrowRight size={16} className="ml-1" />
                    </Link>
                </div>
            </div>
        </Card>
    );
};
