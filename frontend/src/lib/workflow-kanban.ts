export type KanbanColumnId = 'to_process' | 'in_progress' | 'ready';

export type WorkflowOrderStatus =
    | 'CREATED'
    | 'IN_PROGRESS'
    | 'READY'
    | 'STORED'
    | 'DELIVERED'
    | 'CANCELLED';

export interface WorkflowOrder {
    id: string;
    reference?: string | null;
    status: WorkflowOrderStatus | string;
    total_price: number;
    due_date: string;
    created_at?: string;
    items?: unknown[];
    items_count?: number;
    items_summary?: string;
    client_id: string;
    client_name?: string | null;
    service_level?: string;
    slot_label?: string | null;
    slot_type?: string | null;
    is_late?: boolean;
}

export const KANBAN_COLUMNS: Array<{
    id: KanbanColumnId;
    title: string;
    dotClass: string;
    headerClass: string;
}> = [
    {
        id: 'to_process',
        title: 'À traiter',
        dotClass: 'bg-slate-400',
        headerClass: 'text-slate-300',
    },
    {
        id: 'in_progress',
        title: 'En cours',
        dotClass: 'bg-blue-400',
        headerClass: 'text-blue-300',
    },
    {
        id: 'ready',
        title: 'Prêtes',
        dotClass: 'bg-emerald-400',
        headerClass: 'text-emerald-300',
    },
];

export function getKanbanColumn(status: string | null | undefined): KanbanColumnId | null {
    switch (String(status || '').toUpperCase()) {
        case 'CREATED':
            return 'to_process';
        case 'IN_PROGRESS':
            return 'in_progress';
        case 'READY':
        case 'STORED':
            return 'ready';
        default:
            return null;
    }
}

/** Target status when dropping into a column (forward transitions only). */
export function getTargetStatusForColumn(
    fromStatus: string,
    toColumn: KanbanColumnId,
): WorkflowOrderStatus | null {
    const from = String(fromStatus).toUpperCase();
    const fromCol = getKanbanColumn(from);

    if (!fromCol || fromCol === toColumn) return null;

    if (fromCol === 'to_process' && toColumn === 'in_progress' && from === 'CREATED') {
        return 'IN_PROGRESS';
    }
    if (fromCol === 'in_progress' && toColumn === 'ready' && from === 'IN_PROGRESS') {
        return 'READY';
    }

    return null;
}

export function groupOrdersByColumn(
    orders: WorkflowOrder[],
): Record<KanbanColumnId, WorkflowOrder[]> {
    const groups: Record<KanbanColumnId, WorkflowOrder[]> = {
        to_process: [],
        in_progress: [],
        ready: [],
    };

    for (const order of orders) {
        const col = getKanbanColumn(order.status);
        if (col) groups[col].push(order);
    }

    return groups;
}

export function isExpressOrder(order: Pick<WorkflowOrder, 'service_level'>): boolean {
    return String(order.service_level || '').toUpperCase() === 'EXPRESS';
}

export function orderNeedsReceptionSlot(order: Pick<WorkflowOrder, 'status' | 'slot_label'>): boolean {
    return String(order.status).toUpperCase() === 'CREATED' && !order.slot_label;
}
