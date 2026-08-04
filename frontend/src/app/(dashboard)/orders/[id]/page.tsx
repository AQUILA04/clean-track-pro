'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    ArrowLeft,
    Check,
    Grid3X3,
    Mail,
    MapPin,
    Package,
    Pencil,
    Phone,
    Printer,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { OrdersService } from '@/services/orders.service';
import { formatOrderLabel } from '@/lib/order-display';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { Badge } from '@/components/ui/Badge';
import { formatStatusLabel } from '@/lib/status-labels';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { useToast } from '@/components/ui/simple-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useFormatMoney } from '@/context/tenant-config.context';

interface OrderItemRow {
    id: string;
    quantity: number;
    price: number;
    article_label?: string | null;
    service_label?: string | null;
    article_type_id?: string;
    service_definition_id?: string;
}

interface OrderDetail {
    id: string;
    reference?: string | null;
    status: string;
    client_id: string;
    client_name?: string;
    client_phone?: string | null;
    client_email?: string | null;
    delivery_address?: string | null;
    delivery_mode?: string;
    payment_status?: string;
    amount_paid?: number;
    total_price: number;
    service_level?: string;
    created_at: string;
    updated_at?: string;
    due_date?: string;
    slot_label?: string | null;
    slot_type?: string | null;
    items?: OrderItemRow[];
}

const NEXT_STATUS: Record<string, string | null> = {
    CREATED: 'IN_PROGRESS',
    IN_PROGRESS: 'READY',
    READY: null,
    STORED: null,
    DELIVERED: null,
    CANCELLED: null,
};

function locationHint(status: string, slotLabel?: string | null): string {
    if (slotLabel) {
        if (status === 'READY' || status === 'STORED') return 'Prêt pour ramassage';
        if (status === 'CREATED') return 'En réception';
        return 'Emplacement actuel';
    }
    if (status === 'DELIVERED') return 'Commande livrée';
    if (status === 'CANCELLED') return 'Commande annulée';
    return 'Non rangée';
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const { toast } = useToast();
    const formatMoney = useFormatMoney();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await OrdersService.getById(orderId);
            setOrder(data);
        } catch (error) {
            console.error('Failed to load order', error);
            setOrder(null);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger la commande.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [orderId, toast]);

    useEffect(() => {
        load();
    }, [load]);

    const updateStatus = async (status: string) => {
        if (!order) return;
        setActionLoading(true);
        try {
            const updated = await OrdersService.updateStatus(order.id, status);
            setOrder({
                ...order,
                ...updated,
                client_name: updated.client_name || order.client_name,
                client_phone: updated.client_phone ?? order.client_phone,
                client_email: updated.client_email ?? order.client_email,
            });
            toast({
                title: 'Statut mis à jour',
                description: formatStatusLabel(status),
                variant: 'success',
            });
        } catch (error: any) {
            const message = error?.response?.data?.message;
            toast({
                title: 'Échec',
                description: Array.isArray(message) ? message[0] : message || 'Mise à jour impossible',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="py-16 text-center text-muted-foreground">Chargement de la commande…</div>;
    }

    if (!order) {
        return (
            <div className="space-y-4 py-10">
                <Link href="/orders/active" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux commandes
                </Link>
                <p className="text-red-400">Commande introuvable.</p>
            </div>
        );
    }

    const label = formatOrderLabel(order);
    const clientName = order.client_name || 'Client inconnu';
    const items = order.items || [];
    const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 0), 0);
    const total = Number(order.total_price) || subtotal;
    const nextStatus = NEXT_STATUS[order.status];
    const canCancel = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

    return (
        <div className="space-y-6 pb-10">
            <div>
                <nav className="text-sm text-muted-foreground mb-3">
                    <Link href="/orders/active" className="hover:text-foreground">
                        Commandes
                    </Link>
                    <span className="mx-2">/</span>
                    <span>Détail {label}</span>
                </nav>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground">Commande {label}</h1>
                            <StatusLabel status={order.status} />
                            {order.service_level === 'EXPRESS' && <Badge express />}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Client : {clientName}
                            {order.created_at && (
                                <>
                                    {' '}
                                    • Créée le{' '}
                                    {format(new Date(order.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                </>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 border border-border"
                            onClick={() => router.push('/workflow')}
                        >
                            <Pencil className="h-4 w-4" />
                            Modifier
                        </Button>
                        {nextStatus && (
                            <Button
                                size="sm"
                                className="gap-2"
                                isLoading={actionLoading}
                                onClick={() => updateStatus(nextStatus)}
                            >
                                <Check className="h-4 w-4" />
                                Valider l&apos;étape
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_260px] gap-6">
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                            Informations client
                        </h2>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5" /> Téléphone
                                </dt>
                                <dd className="text-foreground font-medium">{order.client_phone || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" /> Adresse de livraison
                                </dt>
                                <dd className="text-foreground font-medium">
                                    {order.delivery_address || 'Retrait en agence'}
                                </dd>
                            </div>
                            {order.client_email && (
                                <div>
                                    <dt className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" /> Email
                                    </dt>
                                    <dd className="text-foreground font-medium break-all">{order.client_email}</dd>
                                </div>
                            )}
                            <div>
                                <Link
                                    href={`/clients/${order.client_id}`}
                                    className="text-primary text-sm hover:underline"
                                >
                                    Voir la fiche client
                                </Link>
                            </div>
                        </dl>
                    </Card>

                    <Card>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                            Détails de paiement
                        </h2>
                        <dl className="space-y-4 text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted-foreground">Statut</dt>
                                <dd>
                                    <StatusLabel status={order.payment_status || 'UNPAID'} kind="payment" />
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="text-muted-foreground">Montant payé</dt>
                                <dd className="text-foreground font-medium">
                                    {formatMoney(order.amount_paid || 0)}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                                <dt className="font-semibold text-foreground">Total</dt>
                                <dd className="text-xl font-bold text-primary">{formatMoney(total)}</dd>
                            </div>
                        </dl>
                    </Card>
                </div>

                <Card padding="none" className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Articles commandés</h2>
                        <span className="text-sm text-muted-foreground">
                            {itemCount} article{itemCount > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Service / article
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Qté
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Prix unit.
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                            Aucun article
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => {
                                        const unit = Number(item.price);
                                        const line = unit * (item.quantity || 0);
                                        return (
                                            <tr key={item.id} className="border-b border-border/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                                            <Package className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {item.article_label || 'Article'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {item.service_label || 'Service'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-foreground">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                                                    {formatMoney(unit)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-foreground whitespace-nowrap">
                                                    {formatMoney(line)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-border space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Sous-total</span>
                            <span>{formatMoney(subtotal || total)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Taxes</span>
                            <span>{formatMoney(0)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                            <span className="text-foreground">Total TTC</span>
                            <span className="text-primary">{formatMoney(total)}</span>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                            Actions
                        </h2>
                        <div className="space-y-2">
                            {nextStatus ? (
                                <Button
                                    className="w-full justify-start gap-2"
                                    isLoading={actionLoading}
                                    onClick={() => updateStatus(nextStatus)}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Modifier le statut → {formatStatusLabel(nextStatus)}
                                </Button>
                            ) : (
                                <Button className="w-full justify-start gap-2" disabled>
                                    <RefreshCw className="h-4 w-4" />
                                    Aucune étape suivante
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 border border-border"
                                onClick={() =>
                                    toast({
                                        title: 'Impression',
                                        description: 'Utilisez le workflow ou la réception pour réimprimer le ticket.',
                                    })
                                }
                            >
                                <Printer className="h-4 w-4" />
                                Imprimer le ticket
                            </Button>
                            <Link href="/storage/scan" className="block">
                                <Button variant="ghost" className="w-full justify-start gap-2 border border-border">
                                    <Grid3X3 className="h-4 w-4" />
                                    Assigner à un rayon
                                </Button>
                            </Link>
                            {order.client_email || order.client_phone ? (
                                <a
                                    href={
                                        order.client_email
                                            ? `mailto:${order.client_email}`
                                            : `tel:${order.client_phone}`
                                    }
                                    className="block"
                                >
                                    <Button variant="ghost" className="w-full justify-start gap-2 border border-border">
                                        <Mail className="h-4 w-4" />
                                        Contacter le client
                                    </Button>
                                </a>
                            ) : (
                                <Button variant="ghost" className="w-full justify-start gap-2 border border-border" disabled>
                                    <Mail className="h-4 w-4" />
                                    Contacter le client
                                </Button>
                            )}
                            {canCancel && (
                                <Button
                                    variant="destructive"
                                    className="w-full justify-start gap-2 mt-4"
                                    onClick={() => setCancelOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Annuler la commande
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Emplacement</p>
                                <p className="text-xl font-bold text-foreground">
                                    {order.slot_label || 'Non assigné'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {locationHint(order.status, order.slot_label)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <OrderTimeline
                status={order.status}
                createdAt={order.created_at}
                updatedAt={order.updated_at}
            />

            <ConfirmationModal
                isOpen={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onConfirm={async () => {
                    setCancelOpen(false);
                    await updateStatus('CANCELLED');
                }}
                title="Annuler la commande ?"
                message={`La commande ${label} sera marquée comme annulée. Cette action est définitive.`}
                confirmLabel="Annuler la commande"
                variant="danger"
            />
        </div>
    );
}
