'use client';

import React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MapPin, Zap } from 'lucide-react';
import { formatOrderLabel } from '@/lib/order-display';
import { StatusLabel } from '@/components/shared/StatusLabel';

export interface QueueOrder {
    id: string;
    reference?: string | null;
    status: string;
    client_name?: string | null;
    items_summary?: string;
    items_count?: number;
    due_date?: string;
    service_level?: string;
    slot_label?: string | null;
    slot_type?: string | null;
    total_price?: number;
    balance_due?: number;
    payment_status?: string;
    is_late?: boolean;
}

const AVATAR_COLORS = [
    'bg-violet-500/20 text-violet-300',
    'bg-sky-500/20 text-sky-300',
    'bg-emerald-500/20 text-emerald-300',
    'bg-amber-500/20 text-amber-300',
    'bg-rose-500/20 text-rose-300',
    'bg-indigo-500/20 text-indigo-300',
];

function clientInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
    }
    return AVATAR_COLORS[hash];
}

function formatDue(dueDate?: string): string {
    if (!dueDate) return '';
    try {
        const d = parseISO(dueDate);
        const time = format(d, 'HH:mm');
        if (isToday(d)) return `Aujourd'hui ${time}`;
        return format(d, 'dd MMM HH:mm', { locale: fr });
    } catch {
        return '';
    }
}

interface OpsOrderQueueProps {
    title: string;
    orders: QueueOrder[];
    loading?: boolean;
    selectedId?: string | null;
    onSelect: (order: QueueOrder) => void;
    emptyMessage?: string;
    /** Show slot badge when present */
    showSlot?: boolean;
}

export function OpsOrderQueue({
    title,
    orders,
    loading,
    selectedId,
    onSelect,
    emptyMessage = 'Aucune commande pour cette étape.',
    showSlot = false,
}: OpsOrderQueueProps) {
    return (
        <div className="flex flex-col rounded-xl border border-border bg-card min-h-[420px] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {orders.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] p-2 space-y-2">
                {loading ? (
                    <div className="space-y-2 p-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-20 rounded-xl border border-border bg-muted/30 animate-pulse"
                            />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-12 px-4">
                        {emptyMessage}
                    </p>
                ) : (
                    orders.map((order) => {
                        const name = order.client_name?.trim() || 'Client inconnu';
                        const express = String(order.service_level || '').toUpperCase() === 'EXPRESS';
                        const selected = selectedId === order.id;
                        const due = formatDue(order.due_date);
                        const items =
                            order.items_summary ||
                            (order.items_count != null
                                ? `${order.items_count} article${order.items_count > 1 ? 's' : ''}`
                                : null);

                        return (
                            <button
                                key={order.id}
                                type="button"
                                onClick={() => onSelect(order)}
                                className={`
                                    w-full text-left rounded-xl border p-3 space-y-2 transition-colors duration-150
                                    ${
                                        selected
                                            ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                                            : express
                                              ? 'border-accent/50 bg-card hover:bg-muted/40'
                                              : 'border-border bg-card hover:bg-muted/40'
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono text-xs text-primary">
                                        {formatOrderLabel(order)}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {express && (
                                            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/20 text-accent px-1.5 py-0.5 text-[10px] font-semibold">
                                                <Zap className="h-3 w-3" />
                                                Express
                                            </span>
                                        )}
                                        <StatusLabel status={order.status} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(name)}`}
                                    >
                                        {clientInitials(name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {name}
                                        </p>
                                        {items && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {items}
                                            </p>
                                        )}
                                    </div>
                                    {due && (
                                        <span
                                            className={`text-[11px] whitespace-nowrap ${
                                                order.is_late
                                                    ? 'text-amber-400'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {due}
                                        </span>
                                    )}
                                </div>

                                {showSlot && order.slot_label && (
                                    <div className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-xs font-semibold text-emerald-400">
                                        <MapPin className="h-3 w-3" />
                                        {order.slot_label}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
