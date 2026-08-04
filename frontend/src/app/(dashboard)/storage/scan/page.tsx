'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { OrdersService } from '@/services/orders.service';
import { SlotType } from '@/services/storage.service';
import { OrderMatchModal, OrderMatchCandidate } from '@/components/orders/OrderMatchModal';
import { StorageSlotPicker } from '@/components/storage/StorageSlotPicker';
import { OpsOrderQueue, type QueueOrder } from '@/components/storage/OpsOrderQueue';
import { OrderStorageLocation } from '@/components/storage/OrderStorageLocation';
import { formatOrderLabel } from '@/lib/order-display';
import { formatStatusLabel } from '@/lib/status-labels';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { useFormatMoney } from '@/context/tenant-config.context';

export default function StorageScannerPage() {
    const formatMoney = useFormatMoney();
    const { data: session } = useSession();
    const siteId =
        (session?.user as { site_ids?: string[]; site_id?: string } | undefined)?.site_ids?.[0] ||
        (session?.user as { site_id?: string } | undefined)?.site_id ||
        '';

    const [orders, setOrders] = useState<QueueOrder[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<QueueOrder | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [matchCandidates, setMatchCandidates] = useState<OrderMatchCandidate[]>([]);
    const [showMatchModal, setShowMatchModal] = useState(false);

    const fetchReadyOrders = useCallback(async (q?: string) => {
        setListLoading(true);
        try {
            const result = await OrdersService.findAll(1, 100, 'active', undefined, {
                status: 'ready',
                q: q || undefined,
            });
            const ready = ((result.data || []) as QueueOrder[]).filter(
                (o) => String(o.status).toUpperCase() === 'READY',
            );
            setOrders(ready);
        } catch (error) {
            console.error(error);
            toast.error('Impossible de charger les commandes à ranger');
            setOrders([]);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReadyOrders(search);
    }, [fetchReadyOrders, search]);

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const selectOrder = (order: QueueOrder) => {
        if (String(order.status).toUpperCase() !== 'READY') {
            toast.error(
                `La commande est « ${formatStatusLabel(order.status)} ». Elle doit être prête pour le rangement.`,
            );
            return;
        }
        setSelected(order);
    };

    const clearSelection = () => setSelected(null);

    /** Exact lookup on Enter — keeps barcode workflow fast */
    const handleLookupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = searchInput.trim();
        if (!value) return;

        setDetailLoading(true);
        try {
            const result = await OrdersService.lookup(value, {
                statuses: ['READY'],
                siteId: siteId || undefined,
            });

            if (result.count === 0 || !result.orders?.length) {
                toast.error('Aucune commande prête ne correspond');
                return;
            }

            if (result.count > 1) {
                setMatchCandidates(result.orders);
                setShowMatchModal(true);
                return;
            }

            selectOrder(result.orders[0] as QueueOrder);
            setSearchInput('');
            setSearch('');
        } catch (error: unknown) {
            const ax = error as { response?: { data?: { message?: string | string[] } } };
            const message = ax?.response?.data?.message;
            toast.error(
                Array.isArray(message) ? message[0] : message || 'Commande introuvable',
            );
        } finally {
            setDetailLoading(false);
        }
    };

    const handleMatchSelect = async (candidate: OrderMatchCandidate) => {
        setShowMatchModal(false);
        setDetailLoading(true);
        try {
            const order = await OrdersService.getById(candidate.id);
            selectOrder(order as QueueOrder);
            setSearchInput('');
            setSearch('');
        } catch {
            toast.error('Commande introuvable');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleStorageAssigned = async (slotName: string) => {
        if (!selected) return;
        toast.success(`${formatOrderLabel(selected)} rangée dans ${slotName}`);
        setSelected(null);
        await fetchReadyOrders(search);
    };

    const queueOrders = useMemo(() => {
        if (!selected) return orders;
        // Keep selected visible even if search would hide it
        if (orders.some((o) => o.id === selected.id)) return orders;
        return [selected, ...orders];
    }, [orders, selected]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Rangement livraison</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Commandes prêtes à ranger dans un rayon de livraison.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchReadyOrders(search)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors self-start"
                    title="Actualiser"
                    aria-label="Actualiser"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            <form onSubmit={handleLookupSubmit} className="max-w-xl">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Rechercher ou scanner N° commande / client…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        aria-label="Rechercher une commande prête"
                    />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                    Filtre la file en direct — Entrée pour un scan exact
                </p>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <OpsOrderQueue
                    title="À ranger"
                    orders={queueOrders}
                    loading={listLoading}
                    selectedId={selected?.id}
                    onSelect={selectOrder}
                    emptyMessage="Aucune commande prête à ranger."
                />

                <div className="rounded-xl border border-border bg-card min-h-[420px] p-4">
                    {detailLoading ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[380px] text-muted-foreground">
                            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                            Chargement…
                        </div>
                    ) : selected ? (
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                        Commande sélectionnée
                                    </p>
                                    <p className="font-mono text-lg text-primary">
                                        {formatOrderLabel(selected)}
                                    </p>
                                    <p className="text-sm font-medium text-foreground mt-1">
                                        {selected.client_name?.trim() || 'Client inconnu'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <StatusLabel status={selected.status} />
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Désélectionner
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                        Articles
                                    </p>
                                    <p className="text-sm text-foreground mt-1">
                                        {selected.items_summary ||
                                            selected.items_count ||
                                            '—'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                        Total
                                    </p>
                                    <p className="text-sm font-bold text-foreground mt-1">
                                        {selected.total_price != null
                                            ? formatMoney(selected.total_price)
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            <OrderStorageLocation
                                slotLabel={selected.slot_label}
                                slotType={selected.slot_type as SlotType | null | undefined}
                            />

                            {siteId ? (
                                <StorageSlotPicker
                                    orderId={selected.id}
                                    slotType={SlotType.DELIVERY}
                                    siteId={siteId}
                                    orderStatus={selected.status}
                                    onAssigned={handleStorageAssigned}
                                    onError={(msg) => toast.error(msg)}
                                    label="Choisir un rayon de livraison"
                                />
                            ) : (
                                <p className="text-sm text-amber-400">
                                    Aucune agence associée à votre session.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[380px] text-center px-6">
                            <p className="text-lg font-medium text-foreground">
                                Sélectionnez une commande
                            </p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Choisissez une commande dans la file « À ranger », ou scannez
                                une référence pour afficher le choix de rayon.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <OrderMatchModal
                isOpen={showMatchModal}
                orders={matchCandidates}
                onSelect={handleMatchSelect}
                onClose={() => {
                    setShowMatchModal(false);
                    setMatchCandidates([]);
                }}
            />
        </div>
    );
}
