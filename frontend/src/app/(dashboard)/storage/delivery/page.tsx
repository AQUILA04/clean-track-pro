'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { OrdersService } from '@/services/orders.service';
import { StorageService } from '@/services/storage.service';
import { PaymentService, PaymentMethod, PaymentPhase } from '@/services/payment.service';
import { OrderDeliveryCard } from '@/components/storage/OrderDeliveryCard';
import { OpsOrderQueue, type QueueOrder } from '@/components/storage/OpsOrderQueue';
import { OrderMatchModal, OrderMatchCandidate } from '@/components/orders/OrderMatchModal';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { ContentLoader } from '@/components/ui/loading';
import { getErrorMessage } from '@/lib/api-error';
import { formatOrderLabel } from '@/lib/order-display';
import { formatStatusLabel } from '@/lib/status-labels';
import { useFormatMoney } from '@/context/tenant-config.context';

type LookupMatch = {
    order: any;
    slot_label: string | null;
};

function DeliveryPageContent() {
    const formatMoney = useFormatMoney();
    const { data: session, status: sessionStatus } = useSession();
    const searchParams = useSearchParams();
    const siteId =
        (session?.user as { site_ids?: string[]; site_id?: string } | undefined)?.site_ids?.[0] ||
        (session?.user as { site_id?: string } | undefined)?.site_id ||
        '';

    const [orders, setOrders] = useState<QueueOrder[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [lookupResult, setLookupResult] = useState<LookupMatch | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [matchCandidates, setMatchCandidates] = useState<OrderMatchCandidate[]>([]);
    const [showMatchModal, setShowMatchModal] = useState(false);

    const preloadDoneRef = useRef(false);

    const balanceDue = lookupResult
        ? Number(lookupResult.order.total_price) - Number(lookupResult.order.amount_paid || 0)
        : 0;
    const needsPayment =
        !!lookupResult &&
        lookupResult.order.payment_status !== 'PAID' &&
        balanceDue > 0;

    const fetchStoredOrders = useCallback(async (q?: string) => {
        setListLoading(true);
        try {
            const result = await OrdersService.findAll(1, 100, 'active', undefined, {
                status: 'ready',
                q: q || undefined,
            });
            const stored = ((result.data || []) as QueueOrder[]).filter(
                (o) => String(o.status).toUpperCase() === 'STORED',
            );
            setOrders(stored);
        } catch (error) {
            console.error(error);
            toast.error('Impossible de charger les commandes à livrer');
            setOrders([]);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStoredOrders(search);
    }, [fetchStoredOrders, search]);

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const applyLookup = (result: LookupMatch) => {
        if (result.order.delivery_mode === 'HOME_DELIVERY') {
            toast.error(
                'Cette commande doit être remise via les Tournées livreur, pas au comptoir.',
            );
            setLookupResult(null);
            setShowMatchModal(false);
            setMatchCandidates([]);
            return;
        }

        if (result.order.status === 'DELIVERED') {
            toast.message(`La commande ${formatOrderLabel(result.order)} est déjà livrée.`);
        } else if (result.order.status !== 'STORED') {
            toast.error(
                `La commande est « ${formatStatusLabel(result.order.status)} ». Elle doit être rangée avant remise au client.`,
            );
        } else if (!result.slot_label) {
            toast.error("La commande n'a pas d'emplacement de stockage.");
        }

        setLookupResult(result);
        setShowMatchModal(false);
        setMatchCandidates([]);
        setShowPaymentForm(false);
    };

    const loadOrderById = async (orderId: string) => {
        setLoading(true);
        try {
            const result = await StorageService.lookupOrder(orderId);
            applyLookup(result);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Commande introuvable'));
            setLookupResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handleQueueSelect = (order: QueueOrder) => {
        void loadOrderById(order.id);
    };

    const handleLookupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = searchInput.trim();
        if (!value) return;

        setLoading(true);
        try {
            const result = await StorageService.lookupOrders(value, {
                siteId: siteId || undefined,
                statuses: ['STORED', 'DELIVERED'],
            });

            if (result.count === 0 || !result.matches?.length) {
                toast.error('Commande introuvable');
                setLookupResult(null);
                return;
            }

            if (result.count > 1) {
                setMatchCandidates(
                    result.matches.map((m) => ({
                        ...m.order,
                        slot_label: m.slot_label,
                        client_name: m.order.client
                            ? `${m.order.client.first_name || ''} ${m.order.client.last_name || ''}`.trim()
                            : undefined,
                    })),
                );
                setShowMatchModal(true);
                return;
            }

            applyLookup(result.matches[0]);
            setSearchInput('');
            setSearch('');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Commande introuvable'));
            setLookupResult(null);
        } finally {
            setLoading(false);
        }
    };

    // Auto-load when arriving with ?order=
    useEffect(() => {
        if (preloadDoneRef.current) return;
        if (sessionStatus === 'loading') return;

        const orderParam = searchParams.get('order')?.trim();
        if (!orderParam) {
            preloadDoneRef.current = true;
            return;
        }

        preloadDoneRef.current = true;
        void (async () => {
            setSearchInput(orderParam);
            setLoading(true);
            try {
                const result = await StorageService.lookupOrders(orderParam, {
                    siteId: siteId || undefined,
                    statuses: ['STORED', 'DELIVERED'],
                });
                if (result.count === 1 && result.matches?.[0]) {
                    applyLookup(result.matches[0]);
                    setSearchInput('');
                } else if (result.count > 1) {
                    setMatchCandidates(
                        result.matches.map((m) => ({
                            ...m.order,
                            slot_label: m.slot_label,
                            client_name: m.order.client
                                ? `${m.order.client.first_name || ''} ${m.order.client.last_name || ''}`.trim()
                                : undefined,
                        })),
                    );
                    setShowMatchModal(true);
                } else {
                    toast.error('Commande introuvable');
                }
            } catch (error: unknown) {
                toast.error(getErrorMessage(error, 'Commande introuvable'));
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, sessionStatus, siteId]);

    const handleMatchSelect = async (candidate: OrderMatchCandidate) => {
        setShowMatchModal(false);
        await loadOrderById(candidate.id);
        setSearchInput('');
        setSearch('');
    };

    const resetFlow = () => {
        setLookupResult(null);
        setShowPaymentForm(false);
        setMatchCandidates([]);
        setShowMatchModal(false);
    };

    const processDelivery = async () => {
        if (!lookupResult) return;
        setLoading(true);
        try {
            await StorageService.deliverOrder(lookupResult.order.id);
            toast.success('Commande livrée et rayon libéré');
            resetFlow();
            await fetchStoredOrders(search);
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, 'Impossible de finaliser la livraison'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeliver = async () => {
        if (!lookupResult) return;
        if (needsPayment) {
            setShowPaymentForm(true);
            return;
        }
        await processDelivery();
    };

    const handlePaymentConfirm = async (
        amount: number,
        method: PaymentMethod,
        reference?: string,
    ) => {
        if (!lookupResult) return;
        setLoading(true);
        try {
            await PaymentService.create({
                order_id: lookupResult.order.id,
                amount,
                payment_method: method,
                payment_phase: PaymentPhase.AT_PICKUP,
                reference,
            });
            toast.success(`${amount.toLocaleString()} encaissé avec succès`);
            setShowPaymentForm(false);
            await processDelivery();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error, "Impossible d'enregistrer le paiement"));
        } finally {
            setLoading(false);
        }
    };

    const queueOrders = useMemo(() => {
        if (!lookupResult) return orders;
        const id = lookupResult.order.id;
        if (orders.some((o) => o.id === id)) return orders;
        const synthetic: QueueOrder = {
            id,
            reference: lookupResult.order.reference,
            status: lookupResult.order.status,
            client_name: lookupResult.order.client
                ? `${lookupResult.order.client.first_name || ''} ${lookupResult.order.client.last_name || ''}`.trim()
                : lookupResult.order.client_name,
            slot_label: lookupResult.slot_label,
            service_level: lookupResult.order.service_level,
            total_price: lookupResult.order.total_price,
        };
        return [synthetic, ...orders];
    }, [orders, lookupResult]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Livraison client</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Commandes rangées prêtes à être remises au client au comptoir.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchStoredOrders(search)}
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
                        placeholder="Rechercher ou scanner ticket / référence…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        aria-label="Rechercher une commande à livrer"
                    />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                    Filtre la file en direct — Entrée pour un scan exact
                </p>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <OpsOrderQueue
                    title="À remettre"
                    orders={queueOrders}
                    loading={listLoading}
                    selectedId={lookupResult?.order?.id}
                    onSelect={handleQueueSelect}
                    emptyMessage="Aucune commande rangée en attente de remise."
                    showSlot
                />

                <div className="space-y-4">
                    {showPaymentForm && lookupResult && (
                        <PaymentForm
                            totalPrice={balanceDue}
                            onConfirm={handlePaymentConfirm}
                            onSkip={() => setShowPaymentForm(false)}
                            loading={loading}
                            phase="pickup"
                        />
                    )}

                    {lookupResult ? (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={resetFlow}
                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Désélectionner
                                </button>
                            </div>
                            {needsPayment && !showPaymentForm && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                    <p className="text-sm font-medium text-amber-400">
                                        Solde restant : {formatMoney(balanceDue)}
                                    </p>
                                    <p className="text-xs text-amber-400/70 mt-1">
                                        Le solde doit être réglé avant la remise au client.
                                    </p>
                                </div>
                            )}
                            <OrderDeliveryCard
                                order={lookupResult.order}
                                slotLabel={lookupResult.slot_label}
                                onDeliver={handleDeliver}
                                onCancel={resetFlow}
                                loading={loading}
                            />
                        </div>
                    ) : loading ? (
                        <div className="rounded-xl border border-border bg-card min-h-[420px]">
                            <ContentLoader label="Chargement de la commande…" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center min-h-[420px] flex flex-col justify-center items-center">
                            <p className="text-lg font-medium text-foreground">
                                Sélectionnez une commande
                            </p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Choisissez une commande dans la file « À remettre », vérifiez le
                                rayon, puis confirmez la livraison.
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

export default function DeliveryPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <h1 className="text-2xl font-bold text-foreground">Livraison client</h1>
                    <ContentLoader label="Chargement…" />
                </div>
            }
        >
            <DeliveryPageContent />
        </Suspense>
    );
}
