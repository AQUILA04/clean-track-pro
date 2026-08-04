import React from 'react';
import { Zap } from 'lucide-react';
import {
    formatStatusLabel,
    getStatusPillClass,
} from '@/lib/status-labels';

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

const pillBase = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide';

/** Non-order entity statuses (sites, agencies, etc.) */
const ENTITY_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Actif',
    CLOSED: 'Fermée',
    INACTIVE: 'Inactif',
    MAINTENANCE: 'Maintenance',
};

const ENTITY_STATUS_PILL: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-400',
    CLOSED: 'bg-red-500/10 text-red-400',
    INACTIVE: 'bg-slate-500/10 text-slate-400',
    MAINTENANCE: 'bg-amber-500/10 text-amber-400',
};

export const Badge: React.FC<BadgeProps> = ({ status, express, className = '' }) => {
    if (express) {
        return (
            <span className={`${pillBase} bg-accent/20 text-accent ${className}`}>
                <Zap className="h-3 w-3 mr-1 fill-current" />
                Express
            </span>
        );
    }

    if (!status) return null;

    const key = String(status).toUpperCase();
    if (ENTITY_STATUS_LABELS[key]) {
        return (
            <span className={`${pillBase} ${ENTITY_STATUS_PILL[key]} ${className}`}>
                {ENTITY_STATUS_LABELS[key]}
            </span>
        );
    }

    return (
        <span className={`${pillBase} ${getStatusPillClass(status)} ${className}`}>
            {formatStatusLabel(status)}
        </span>
    );
};
