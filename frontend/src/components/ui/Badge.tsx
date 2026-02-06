import React from 'react';
import { Zap } from 'lucide-react';

export type OrderStatus =
    | 'CREATED'
    | 'IN_PROGRESS'
    | 'READY'
    | 'STORED'
    | 'DELIVERED'
    | 'DELAYED'
    | 'CANCELLED'
    | 'LOST';

interface BadgeProps {
    status?: OrderStatus | string;
    express?: boolean;
    className?: string;
}

const statusConfig: Record<string, { color: string, label: string }> = {
    CREATED: { color: 'text-gray-700 bg-gray-100', label: 'Créée' },
    IN_PROGRESS: { color: 'text-white bg-primary', label: 'En Traitement' },
    READY: { color: 'text-white bg-success', label: 'Prête' },
    STORED: { color: 'text-white bg-[#059669]', label: 'Stockée' },
    DELIVERED: { color: 'text-white bg-success', label: 'Livrée' },
    DELAYED: { color: 'text-white bg-warning', label: 'Retard' },
    CANCELLED: { color: 'text-white bg-gray-700', label: 'Annulée' },
    LOST: { color: 'text-white bg-error', label: 'Perdue' },
    // Agency Statuses
    ACTIVE: { color: 'text-white bg-[#10B981]', label: 'ACTIF' }, // Green-500
    CLOSED: { color: 'text-white bg-destructive', label: 'FERMÉE' },
    INACTIVE: { color: 'text-white bg-gray-500', label: 'INACTIF' },
    MAINTENANCE: { color: 'text-white bg-accent', label: 'MAINTENANCE' },
};

export const Badge: React.FC<BadgeProps> = ({ status, express, className = '' }) => {
    // Express Badge
    if (express) {
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-accent text-white ${className}`}>
                <Zap className="h-3 w-3 mr-1 fill-white" />
                EXPRESS
            </span>
        );
    }

    if (!status) return null;

    const config = statusConfig[status] || { color: 'text-gray-700 bg-gray-100', label: status };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${config.color} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 mr-2" />
            {config.label}
        </span>
    );
};
