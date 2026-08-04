'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { formatOrderLabel } from '@/lib/order-display';
import { useFormatMoney } from '@/context/tenant-config.context';

export interface OrderMatchCandidate {
    id: string;
    reference?: string | null;
    status: string;
    total_price?: number;
    client_name?: string;
    client?: { first_name?: string; last_name?: string };
    slot_label?: string | null;
    service_level?: string;
    due_date?: string;
}

interface OrderMatchModalProps {
    isOpen: boolean;
    orders: OrderMatchCandidate[];
    onSelect: (order: OrderMatchCandidate) => void;
    onClose: () => void;
}

const statusLabels: Record<string, string> = {
    CREATED: 'Créée',
    IN_PROGRESS: 'En traitement',
    READY: 'Prête',
    STORED: 'Rangée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
};

function clientLabel(order: OrderMatchCandidate): string {
    if (order.client_name) return order.client_name;
    if (order.client) {
        return `${order.client.first_name || ''} ${order.client.last_name || ''}`.trim() || '—';
    }
    return '—';
}

export function OrderMatchModal({ isOpen, orders, onSelect, onClose }: OrderMatchModalProps) {
    const formatMoney = useFormatMoney();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Plusieurs commandes trouvées">
            <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez la commande à traiter.
            </p>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {orders.map((order) => (
                    <li key={order.id}>
                        <button
                            type="button"
                            onClick={() => onSelect(order)}
                            className="w-full text-left p-3 rounded-xl border border-border bg-muted/20 hover:bg-primary/10 hover:border-primary/40 transition-colors duration-150"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-mono font-semibold text-primary text-sm">
                                        {formatOrderLabel(order)}
                                    </p>
                                    <p className="text-sm text-foreground mt-0.5">{clientLabel(order)}</p>
                                    {order.slot_label && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Rayon : {order.slot_label}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                        {statusLabels[order.status] || order.status}
                                    </span>
                                    {order.total_price != null && (
                                        <p className="text-sm font-medium text-foreground mt-1">
                                            {formatMoney(order.total_price)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                    Annuler
                </button>
            </div>
        </Modal>
    );
}
