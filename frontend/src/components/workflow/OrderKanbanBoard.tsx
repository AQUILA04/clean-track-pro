'use client';

import React, { useMemo, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import { OrderKanbanColumn } from './OrderKanbanColumn';
import { OrderKanbanCard } from './OrderKanbanCard';
import {
    KANBAN_COLUMNS,
    getKanbanColumn,
    getTargetStatusForColumn,
    groupOrdersByColumn,
    type KanbanColumnId,
    type WorkflowOrder,
    type WorkflowOrderStatus,
} from '@/lib/workflow-kanban';

interface OrderKanbanBoardProps {
    orders: WorkflowOrder[];
    onRequestTransition: (order: WorkflowOrder, targetStatus: WorkflowOrderStatus) => void;
    onStore: (order: WorkflowOrder) => void;
}

export function OrderKanbanBoard({
    orders,
    onRequestTransition,
    onStore,
}: OrderKanbanBoardProps) {
    const [activeOrder, setActiveOrder] = useState<WorkflowOrder | null>(null);
    const grouped = useMemo(() => groupOrdersByColumn(orders), [orders]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        const order = event.active.data.current?.order as WorkflowOrder | undefined;
        setActiveOrder(order ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveOrder(null);
        const { active, over } = event;
        if (!over) return;

        const order = active.data.current?.order as WorkflowOrder | undefined;
        if (!order) return;

        const overId = String(over.id);
        const columnIds = KANBAN_COLUMNS.map((c) => c.id);
        const toColumn = (columnIds.includes(overId as KanbanColumnId)
            ? overId
            : null) as KanbanColumnId | null;

        // Dropped on another card → resolve its column
        let targetColumn = toColumn;
        if (!targetColumn) {
            const overOrder = orders.find((o) => o.id === overId);
            if (overOrder) {
                targetColumn = getKanbanColumn(overOrder.status);
            }
        }

        if (!targetColumn) return;

        const targetStatus = getTargetStatusForColumn(order.status, targetColumn);
        if (!targetStatus) return;

        onRequestTransition(order, targetStatus);
    };

    const handleDragCancel = () => setActiveOrder(null);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {KANBAN_COLUMNS.map((col) => (
                    <OrderKanbanColumn
                        key={col.id}
                        columnId={col.id}
                        orders={grouped[col.id]}
                        onStore={onStore}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={null}>
                {activeOrder ? <OrderKanbanCard order={activeOrder} isDragOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
