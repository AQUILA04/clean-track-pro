'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Phone, Package, Check } from 'lucide-react';
import {
    DeliveriesService,
    ReadyDeliveryGroup,
} from '@/services/deliveries.service';
import { LocalityService, Locality } from '@/services/locality.service';
import { useToast } from '@/components/ui/simple-toast';
import { getErrorMessage } from '@/lib/api-error';
import { ContentLoader } from '@/components/ui/loading';

export default function DeliveriesPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const siteId =
        (session?.user as { site_ids?: string[]; site_id?: string } | undefined)?.site_ids?.[0] ||
        (session?.user as { site_id?: string } | undefined)?.site_id ||
        '';

    const [groups, setGroups] = useState<ReadyDeliveryGroup[]>([]);
    const [localities, setLocalities] = useState<Locality[]>([]);
    const [localityId, setLocalityId] = useState('');
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ready, locs] = await Promise.all([
                DeliveriesService.listReady(siteId || undefined, localityId || undefined),
                siteId ? LocalityService.list(siteId, true) : Promise.resolve([]),
            ]);
            setGroups(ready);
            setLocalities(locs);
        } catch (err) {
            toast({
                title: 'Erreur',
                description: getErrorMessage(err, 'Impossible de charger les tournees'),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [siteId, localityId, toast]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleConfirm = async (orderId: string) => {
        setConfirmingId(orderId);
        try {
            await DeliveriesService.confirm(orderId);
            toast({ title: 'Livree', description: 'Commande marquee comme livree.', variant: 'success' });
            await load();
        } catch (err) {
            toast({
                title: 'Echec',
                description: getErrorMessage(err, 'Impossible de confirmer la livraison'),
                variant: 'destructive',
            });
        } finally {
            setConfirmingId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tournees</h1>
                    <p className="text-muted-foreground mt-1">
                        Commandes a domicile rangees, pretes a livrer.
                    </p>
                </div>
                <select
                    value={localityId}
                    onChange={(e) => setLocalityId(e.target.value)}
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                    <option value="">Toutes les localites</option>
                    {localities.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <ContentLoader label="Chargement des livraisons…" />
            ) : groups.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                    Aucune commande prete a livrer.
                </div>
            ) : (
                <div className="space-y-6">
                    {groups.map((group) => (
                        <section key={group.locality_id ?? 'none'} className="space-y-3">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                {group.locality_name}
                                <span className="text-sm font-normal text-muted-foreground">
                                    ({group.orders.length})
                                </span>
                            </h2>
                            <div className="space-y-2">
                                {group.orders.map((order) => (
                                    <div
                                        key={order.order_id}
                                        className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="font-semibold text-foreground">
                                                {order.reference || order.order_id.slice(0, 8)} — {order.client_name}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                <span className="truncate">{order.delivery_address || '—'}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                                {order.delivery_phone || '—'}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Package className="h-3.5 w-3.5" />
                                                Rayon: {order.slot_label || '—'} · {order.payment_status}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={confirmingId === order.order_id}
                                            onClick={() => handleConfirm(order.order_id)}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                                        >
                                            <Check className="h-4 w-4" />
                                            Marquer livree
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
