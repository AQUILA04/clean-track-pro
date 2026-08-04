'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { OrderKanbanCard } from './OrderKanbanCard';
import {
    KANBAN_COLUMNS,
    type KanbanColumnId,
    type WorkflowOrder,
} from '@/lib/workflow-kanban';

interface OrderKanbanColumnProps {
    columnId: KanbanColumnId;
    orders: WorkflowOrder[];
    onStore?: (order: WorkflowOrder) => void;
}

export function OrderKanbanColumn({ columnId, orders, onStore }: OrderKanbanColumnProps) {
    const meta = KANBAN_COLUMNS.find((c) => c.id === columnId)!;
    const { setNodeRef, isOver } = useDroppable({ id: columnId });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col min-h-[420px] rounded-xl border bg-muted/20 transition-colors duration-150 ${
                isOver ? 'border-primary/60 bg-primary/5' : 'border-border'
            }`}
        >
            <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dotClass}`} />
                    <h2
                        className={`text-xs font-semibold uppercase tracking-wide truncate ${meta.headerClass}`}
                    >
                        {meta.title}
                    </h2>
                </div>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {orders.length}
                </span>
            </div>

            <div className="flex-1 space-y-2.5 p-2.5 overflow-y-auto max-h-[calc(100vh-280px)]">
                {orders.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-10 px-2">
                        Aucune commande
                    </p>
                ) : (
                    orders.map((order) => (
                        <OrderKanbanCard key={order.id} order={order} onStore={onStore} />
                    ))
                )}
            </div>
        </div>
    );
}
