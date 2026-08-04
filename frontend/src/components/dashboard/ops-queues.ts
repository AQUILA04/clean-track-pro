/** Order shape used to derive operational queues on site dashboards. */
export type DashboardOrder = {
    id: string;
    reference?: string | null;
    status: string;
    client_name?: string;
    items_summary?: string;
    service_level?: string;
    created_at?: string;
    due_date?: string;
};

export type OpsQueues = {
    toProcess: number;
    toStore: number;
    toDeliver: number;
    delayed: number;
    recent: DashboardOrder[];
};

const ACTIVE_STATUSES = new Set(['CREATED', 'IN_PROGRESS', 'READY', 'STORED']);
const DELAY_MS = 24 * 60 * 60 * 1000;

/**
 * Derive ops counters from a list of orders.
 * Delayed = active orders created more than 24h ago (client heuristic until SLA API exists).
 */
export function deriveOpsQueues(orders: DashboardOrder[]): OpsQueues {
    const list = Array.isArray(orders) ? orders : [];
    const now = Date.now();

    let toProcess = 0;
    let toStore = 0;
    let toDeliver = 0;
    let delayed = 0;

    for (const order of list) {
        if (order.status === 'CREATED') toProcess += 1;
        if (order.status === 'READY') toStore += 1;
        if (order.status === 'STORED') toDeliver += 1;

        if (ACTIVE_STATUSES.has(order.status) && order.created_at) {
            const created = new Date(order.created_at).getTime();
            if (!Number.isNaN(created) && now - created > DELAY_MS) {
                delayed += 1;
            }
        }
    }

    const recent = list
        .filter((o) => ACTIVE_STATUSES.has(o.status) || o.status === 'IN_PROGRESS')
        .slice(0, 5);

    return { toProcess, toStore, toDeliver, delayed, recent };
}

export function normalizeOrdersResponse(payload: unknown): DashboardOrder[] {
    if (Array.isArray(payload)) return payload as DashboardOrder[];
    if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
        return (payload as { data: DashboardOrder[] }).data;
    }
    return [];
}

export function computeOccupancyRate(
    slots: Array<{ status: string }>,
): { rate: number; occupied: number; total: number } {
    const total = slots.length;
    const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;
    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { rate, occupied, total };
}
