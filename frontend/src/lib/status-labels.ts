/**
 * Central French labels for domain statuses (order, payment, timeline).
 * Always use formatStatusLabel() / <StatusLabel /> in UI — never raw enum codes.
 */

export const ORDER_STATUS_LABELS: Record<string, string> = {
    CREATED: 'Créée',
    IN_PROGRESS: 'En cours',
    READY: 'Prête',
    STORED: 'Rangée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
    DELAYED: 'En retard',
    LATE: 'En retard',
    LOST: 'Perdue',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
    UNPAID: 'Impayé',
    PARTIAL: 'Partiel',
    PAID: 'Payé',
};

export const TIMELINE_STEP_LABELS: Record<string, string> = {
    RECEIVED: 'Réceptionnée',
    SORTING: 'Tri & marquage',
    WASHING: 'Lavage en cours',
    IRONING: 'Repassage',
    READY: 'Prêt',
    WAITING: 'Attente',
};

/** Pill classes for dark agency UI (text + bg/10). */
export const ORDER_STATUS_PILL_CLASS: Record<string, string> = {
    CREATED: 'bg-slate-500/10 text-slate-400',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
    READY: 'bg-emerald-500/10 text-emerald-400',
    STORED: 'bg-emerald-500/10 text-emerald-400',
    DELIVERED: 'bg-emerald-500/10 text-emerald-400',
    CANCELLED: 'bg-slate-500/10 text-slate-500',
    DELAYED: 'bg-amber-500/10 text-amber-400',
    LATE: 'bg-amber-500/10 text-amber-400',
    LOST: 'bg-red-500/10 text-red-400',
};

export const PAYMENT_STATUS_PILL_CLASS: Record<string, string> = {
    UNPAID: 'bg-amber-500/10 text-amber-400',
    PARTIAL: 'bg-amber-500/10 text-amber-400',
    PAID: 'bg-emerald-500/10 text-emerald-400',
};

export type StatusKind = 'order' | 'payment' | 'timeline';

const LABEL_MAPS: Record<StatusKind, Record<string, string>> = {
    order: ORDER_STATUS_LABELS,
    payment: PAYMENT_STATUS_LABELS,
    timeline: TIMELINE_STEP_LABELS,
};

const PILL_MAPS: Record<StatusKind, Record<string, string>> = {
    order: ORDER_STATUS_PILL_CLASS,
    payment: PAYMENT_STATUS_PILL_CLASS,
    timeline: {},
};

/**
 * Translate a technical status code to a French UI label (Angular-pipe equivalent).
 * Unknown codes fall back to a humanized string, never the raw SCREAMING_SNAKE if avoidable.
 */
export function formatStatusLabel(
    status: string | null | undefined,
    kind: StatusKind = 'order',
): string {
    if (!status) return '—';
    const key = String(status).trim().toUpperCase();
    const mapped = LABEL_MAPS[kind][key];
    if (mapped) return mapped;
    return key
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export function getStatusPillClass(
    status: string | null | undefined,
    kind: StatusKind = 'order',
): string {
    if (!status) return 'bg-slate-500/10 text-slate-400';
    const key = String(status).trim().toUpperCase();
    return PILL_MAPS[kind][key] || 'bg-slate-500/10 text-slate-400';
}

/** Display status for list rows: LATE overrides when order is overdue. */
export function resolveDisplayOrderStatus(
    status: string,
    options?: { isLate?: boolean },
): string {
    if (options?.isLate && status !== 'DELIVERED' && status !== 'CANCELLED') {
        return 'LATE';
    }
    return status;
}
