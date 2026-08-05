'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatOrderLabel } from '@/lib/order-display';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { resolveDisplayOrderStatus } from '@/lib/status-labels';
import { isExpressOrder, type WorkflowOrder } from '@/lib/workflow-kanban';
import { Badge } from '@/components/ui/Badge';
import { ContentLoader } from '@/components/ui/loading';

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

interface WorkflowTableViewProps {
    orders: WorkflowOrder[];
    loading?: boolean;
    onStore?: (order: WorkflowOrder) => void;
}

export function WorkflowTableView({ orders, loading, onStore }: WorkflowTableViewProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card">
                <ContentLoader label="Chargement des commandes…" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                Aucune commande active.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                N° commande
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Client
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Articles
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Échéance
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Statut
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => {
                            const name = order.client_name?.trim() || 'Client inconnu';
                            const displayStatus = resolveDisplayOrderStatus(order.status, {
                                isLate: order.is_late,
                            });
                            const status = String(order.status).toUpperCase();
                            return (
                                <tr
                                    key={order.id}
                                    className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-100"
                                >
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="font-medium text-primary hover:underline font-mono text-sm"
                                            >
                                                {formatOrderLabel(order)}
                                            </Link>
                                            {isExpressOrder(order) && <Badge express />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(name)}`}
                                            >
                                                {clientInitials(name)}
                                            </div>
                                            <span className="text-sm text-foreground">{name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-foreground">
                                        {order.items_summary ||
                                            order.items_count ||
                                            (Array.isArray(order.items) ? order.items.length : '—')}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                        {order.due_date
                                            ? format(new Date(order.due_date), 'dd/MM/yyyy HH:mm', {
                                                  locale: fr,
                                              })
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusLabel status={displayStatus} />
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        {status === 'READY' && onStore ? (
                                            <button
                                                type="button"
                                                onClick={() => onStore(order)}
                                                className="text-xs font-medium text-emerald-400 hover:underline"
                                            >
                                                Ranger
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Voir
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
