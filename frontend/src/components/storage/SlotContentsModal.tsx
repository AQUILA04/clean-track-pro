'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Package, User } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/Button';
import { formatOrderLabel } from '@/lib/order-display';
import {
    StorageService,
    SlotContentsResponse,
    StorageSlot,
} from '@/services/storage.service';

const orderStatusLabels: Record<string, string> = {
    CREATED: 'Créée',
    IN_PROGRESS: 'En traitement',
    READY: 'Prête',
    STORED: 'Rangée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
};

interface SlotContentsModalProps {
    slot: StorageSlot | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SlotContentsModal({ slot, isOpen, onClose }: SlotContentsModalProps) {
    const [data, setData] = useState<SlotContentsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !slot) {
            setData(null);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        StorageService.getSlotContents(slot.id)
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || 'Erreur de chargement');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, slot]);

    if (!slot) return null;

    const order = data?.order;
    const title = (
        <span className="flex items-center gap-2">
            <span className="font-mono text-primary">{slot.name}</span>
            <span className="text-muted-foreground font-normal">— Contenu</span>
        </span>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            {loading && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                    Chargement…
                </div>
            )}

            {!loading && error && (
                <div className="py-4 text-sm text-red-400">{error}</div>
            )}

            {!loading && !error && !order && (
                <div className="py-6 text-center space-y-2">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        Aucune commande dans ce rayon.
                    </p>
                </div>
            )}

            {!loading && !error && order && (
                <div className="space-y-5">
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                                    Commande
                                </p>
                                <p className="font-mono text-lg font-semibold text-primary">
                                    {formatOrderLabel(order)}
                                </p>
                            </div>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/15 text-primary">
                                {orderStatusLabels[order.status] ?? order.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-border">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {order.client_name}
                                </p>
                                {order.client_phone && (
                                    <p className="text-xs text-muted-foreground">
                                        {order.client_phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            <h4 className="text-sm font-semibold text-foreground">
                                Articles ({order.items.length})
                            </h4>
                        </div>

                        {order.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun article.</p>
                        ) : (
                            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                                {order.items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 px-4 py-3 bg-card"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {item.article_label || 'Article'}
                                            </p>
                                            {item.service_label && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {item.service_label}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
                                            ×{item.quantity}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="ghost" onClick={onClose}>
                            Fermer
                        </Button>
                        {(order.status === 'STORED' || order.status === 'READY') && (
                            <Link href="/storage/delivery">
                                <Button variant="secondary">Retrait client</Button>
                            </Link>
                        )}
                        {order.status === 'CREATED' && (
                            <Link href="/storage/scan">
                                <Button variant="secondary">Rangement</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}
