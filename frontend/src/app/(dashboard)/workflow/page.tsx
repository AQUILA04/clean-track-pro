'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { OrdersService } from '@/services/orders.service';
import { SlotType } from '@/services/storage.service';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/modal';
import { formatOrderLabel } from '@/lib/order-display';
import { formatStatusLabel } from '@/lib/status-labels';
import {
    isExpressOrder,
    orderNeedsReceptionSlot,
    type WorkflowOrder,
    type WorkflowOrderStatus,
} from '@/lib/workflow-kanban';
import { OrderKanbanBoard } from '@/components/workflow/OrderKanbanBoard';
import { WorkflowFilters, type WorkflowViewMode } from '@/components/workflow/WorkflowFilters';
import { WorkflowTableView } from '@/components/workflow/WorkflowTableView';
import { StatusTransitionModal } from '@/components/workflow/StatusTransitionModal';
import { StorageSlotPicker } from '@/components/storage/StorageSlotPicker';

type PendingTransition = {
    order: WorkflowOrder;
    targetStatus: WorkflowOrderStatus;
};

type StoragePickerState = {
    order: WorkflowOrder;
    slotType: SlotType;
    /** After reception assign, continue to this status */
    continueToStatus?: WorkflowOrderStatus;
};

export default function WorkflowPage() {
    const { data: session } = useSession();
    const siteId =
        (session?.user as { site_ids?: string[]; site_id?: string } | undefined)?.site_ids?.[0] ||
        (session?.user as { site_id?: string } | undefined)?.site_id ||
        '';

    const [orders, setOrders] = useState<WorkflowOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [expressOnly, setExpressOnly] = useState(false);
    const [viewMode, setViewMode] = useState<WorkflowViewMode>('kanban');

    const [pending, setPending] = useState<PendingTransition | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [storagePicker, setStoragePicker] = useState<StoragePickerState | null>(null);

    const fetchOrders = useCallback(async (q?: string) => {
        setLoading(true);
        try {
            const result = await OrdersService.findAll(1, 100, 'active', undefined, {
                q: q || undefined,
            });
            setOrders((result.data || []) as WorkflowOrder[]);
        } catch (error) {
            console.error('Failed to fetch workflow orders', error);
            toast.error('Impossible de charger les commandes');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(search);
    }, [fetchOrders, search]);

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const visibleOrders = useMemo(() => {
        if (!expressOnly) return orders;
        return orders.filter(isExpressOrder);
    }, [orders, expressOnly]);

    const requestTransition = (order: WorkflowOrder, targetStatus: WorkflowOrderStatus) => {
        setPending({ order, targetStatus });
    };

    const closeConfirm = () => {
        if (confirming) return;
        setPending(null);
    };

    const applyStatusUpdate = async (order: WorkflowOrder, targetStatus: WorkflowOrderStatus) => {
        const updated = await OrdersService.updateStatus(order.id, targetStatus);
        setOrders((prev) =>
            prev.map((o) =>
                o.id === order.id
                    ? {
                          ...o,
                          ...updated,
                          client_name: updated.client_name || o.client_name,
                          reference: updated.reference || o.reference,
                          slot_label: updated.slot_label ?? o.slot_label,
                      }
                    : o,
            ),
        );
        toast.success(
            `${formatOrderLabel(order)} → ${formatStatusLabel(targetStatus)}`,
        );
    };

    const handleConfirmTransition = async () => {
        if (!pending) return;
        const { order, targetStatus } = pending;

        // Fallback: CREATED without reception slot → picker first
        if (
            targetStatus === 'IN_PROGRESS' &&
            orderNeedsReceptionSlot(order)
        ) {
            setPending(null);
            setStoragePicker({
                order,
                slotType: SlotType.RECEPTION,
                continueToStatus: 'IN_PROGRESS',
            });
            toast.message('Rangement réception requis avant de démarrer le traitement');
            return;
        }

        setConfirming(true);
        try {
            await applyStatusUpdate(order, targetStatus);
            setPending(null);
        } catch (error: unknown) {
            console.error(error);
            const ax = error as { response?: { data?: { message?: string | string[] } } };
            const message = ax?.response?.data?.message;
            toast.error(
                Array.isArray(message)
                    ? message[0]
                    : message || 'Échec de la mise à jour du statut',
            );
        } finally {
            setConfirming(false);
        }
    };

    const openDeliveryStore = (order: WorkflowOrder) => {
        setStoragePicker({ order, slotType: SlotType.DELIVERY });
    };

    const handleStorageAssigned = async (slotName: string) => {
        if (!storagePicker) return;
        const { order, continueToStatus, slotType } = storagePicker;

        toast.success(`${formatOrderLabel(order)} rangée dans ${slotName}`);

        if (continueToStatus) {
            try {
                // Refresh order then transition
                const fresh = await OrdersService.getById(order.id);
                await applyStatusUpdate(
                    { ...order, ...fresh, slot_label: slotName },
                    continueToStatus,
                );
            } catch (error: unknown) {
                console.error(error);
                const ax = error as { response?: { data?: { message?: string | string[] } } };
                const message = ax?.response?.data?.message;
                toast.error(
                    Array.isArray(message)
                        ? message[0]
                        : message || 'Rangement OK, mais échec du changement de statut',
                );
            }
        } else if (slotType === SlotType.DELIVERY) {
            // READY → STORED via assign
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === order.id
                        ? { ...o, status: 'STORED', slot_label: slotName }
                        : o,
                ),
            );
        }

        setStoragePicker(null);
        await fetchOrders(search);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Gestion du cycle de vie
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Suivez et faites avancer les commandes par étape (À traiter → En cours →
                        Prêtes).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchOrders(search)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        title="Actualiser"
                        aria-label="Actualiser"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                    <Link href="/orders">
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nouvelle commande
                        </Button>
                    </Link>
                </div>
            </div>

            <WorkflowFilters
                search={searchInput}
                onSearchChange={setSearchInput}
                expressOnly={expressOnly}
                onExpressOnlyChange={setExpressOnly}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {loading && viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="min-h-[420px] rounded-xl border border-border bg-card animate-pulse"
                        />
                    ))}
                </div>
            ) : viewMode === 'kanban' ? (
                <OrderKanbanBoard
                    orders={visibleOrders}
                    onRequestTransition={requestTransition}
                    onStore={openDeliveryStore}
                />
            ) : (
                <WorkflowTableView
                    orders={visibleOrders}
                    loading={loading}
                    onStore={openDeliveryStore}
                />
            )}

            <StatusTransitionModal
                isOpen={!!pending}
                order={pending?.order ?? null}
                targetStatus={pending?.targetStatus ?? null}
                loading={confirming}
                onConfirm={handleConfirmTransition}
                onClose={closeConfirm}
            />

            <Modal
                isOpen={!!storagePicker}
                onClose={() => setStoragePicker(null)}
                size="lg"
                title={
                    storagePicker?.slotType === SlotType.RECEPTION
                        ? 'Rangement réception'
                        : 'Rangement livraison'
                }
            >
                {storagePicker && siteId && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Commande{' '}
                            <span className="font-mono text-primary">
                                {formatOrderLabel(storagePicker.order)}
                            </span>
                            {storagePicker.order.client_name
                                ? ` — ${storagePicker.order.client_name}`
                                : ''}
                        </p>
                        <StorageSlotPicker
                            orderId={storagePicker.order.id}
                            slotType={storagePicker.slotType}
                            siteId={siteId}
                            orderStatus={storagePicker.order.status}
                            onAssigned={handleStorageAssigned}
                            onError={(msg) => toast.error(msg)}
                            label={
                                storagePicker.slotType === SlotType.RECEPTION
                                    ? 'Choisir un rayon de réception'
                                    : 'Choisir un rayon de livraison'
                            }
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}
