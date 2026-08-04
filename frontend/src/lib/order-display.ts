export function formatOrderLabel(order: {
    id: string;
    reference?: string | null;
}): string {
    if (order.reference) return order.reference;
    return `#${order.id.slice(0, 8)}`;
}

export function formatOrderShortId(order: {
    id: string;
    reference?: string | null;
}): string {
    return formatOrderLabel(order);
}
