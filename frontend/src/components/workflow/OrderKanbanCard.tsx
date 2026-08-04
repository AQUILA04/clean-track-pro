'use client';

import React from 'react';
import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format, isToday, isYesterday, isTomorrow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, MapPin, Zap } from 'lucide-react';
import { formatOrderLabel } from '@/lib/order-display';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { isExpressOrder, type WorkflowOrder } from '@/lib/workflow-kanban';

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

function formatDueLabel(dueDate: string | undefined): string {
    if (!dueDate) return '';
    try {
        const d = parseISO(dueDate);
        const time = format(d, 'HH:mm');
        if (isToday(d)) return `Aujourd'hui, ${time}`;
        if (isYesterday(d)) return `Hier, ${time}`;
        if (isTomorrow(d)) return `Demain, ${time}`;
        return format(d, 'dd MMM, HH:mm', { locale: fr });
    } catch {
        return '';
    }
}

interface OrderKanbanCardProps {
    order: WorkflowOrder;
    onStore?: (order: WorkflowOrder) => void;
    isDragOverlay?: boolean;
}

export function OrderKanbanCard({ order, onStore, isDragOverlay }: OrderKanbanCardProps) {
    const express = isExpressOrder(order);
    const name = order.client_name?.trim() || 'Client inconnu';
    const status = String(order.status).toUpperCase();
    const dueLabel = formatDueLabel(order.due_date);
    const itemsLabel =
        order.items_summary ||
        (order.items_count != null
            ? `${order.items_count} article${order.items_count > 1 ? 's' : ''}`
            : Array.isArray(order.items)
              ? `${order.items.length} article${order.items.length > 1 ? 's' : ''}`
              : null);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: order.id,
        data: { order },
        disabled: isDragOverlay || status === 'STORED',
    });

    const style = transform
        ? { transform: CSS.Translate.toString(transform) }
        : undefined;

    return (
        <div
            ref={isDragOverlay ? undefined : setNodeRef}
            style={isDragOverlay ? undefined : style}
            {...(isDragOverlay ? {} : { ...listeners, ...attributes })}
            className={`
                group relative rounded-xl border bg-card p-3.5 space-y-2.5
                transition-shadow duration-150 cursor-grab active:cursor-grabbing
                touch-none select-none
                ${express ? 'border-accent/70 shadow-[0_0_0_1px_rgba(255,107,0,0.25)]' : 'border-border'}
                ${isDragging ? 'opacity-40' : 'hover:bg-muted/30'}
                ${isDragOverlay ? 'shadow-xl opacity-95 rotate-1' : ''}
            `}
        >
            <div className="flex items-start justify-between gap-2">
                <Link
                    href={`/orders/${order.id}`}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="font-mono text-xs text-primary hover:underline"
                >
                    {formatOrderLabel(order)}
                </Link>
                {dueLabel && (
                    <span
                        className={`text-[11px] whitespace-nowrap ${
                            order.is_late ? 'text-amber-400' : 'text-muted-foreground'
                        }`}
                    >
                        {dueLabel}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2.5">
                <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(name)}`}
                >
                    {clientInitials(name)}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    {itemsLabel && (
                        <p className="text-xs text-muted-foreground truncate">{itemsLabel}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                {express && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 text-accent px-2 py-0.5 text-[11px] font-semibold">
                        <Zap className="h-3 w-3" />
                        Express
                    </span>
                )}
                {status === 'IN_PROGRESS' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-blue-400">
                        <span className="h-1.5 flex-1 min-w-[48px] rounded-full bg-blue-500/30 overflow-hidden">
                            <span className="block h-full w-2/3 rounded-full bg-blue-400" />
                        </span>
                        Traitement…
                    </span>
                )}
                {status === 'READY' && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Prête
                    </span>
                )}
                {status === 'STORED' && (
                    <>
                        <StatusLabel status="STORED" />
                        {order.slot_label && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {order.slot_label}
                            </span>
                        )}
                    </>
                )}
            </div>

            {status === 'READY' && onStore && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onStore(order);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-full mt-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                    Ranger en livraison
                </button>
            )}
        </div>
    );
}
