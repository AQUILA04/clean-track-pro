'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Pencil, ShoppingBag } from 'lucide-react';
import { ClientService, ClientRecord } from '@/services/client.service';
import { OrdersService } from '@/services/orders.service';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { useFormatMoney } from '@/context/tenant-config.context';
import { PageLoader, TableLoadingRow } from '@/components/ui/loading';

type ClientOrder = {
    id: string;
    reference?: string;
    status: string;
    total_price: number;
    payment_status?: string;
    created_at: string;
    due_date?: string;
    items_summary?: string;
};

export default function ClientDetailPage() {
    const params = useParams();
    const clientId = params.id as string;
    const formatMoney = useFormatMoney();

    const [client, setClient] = useState<ClientRecord | null>(null);
    const [orders, setOrders] = useState<ClientOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadClient = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ClientService.getById(clientId);
            setClient(data);
        } catch {
            setError('Impossible de charger le client.');
            setClient(null);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    const loadOrders = useCallback(async () => {
        setOrdersLoading(true);
        try {
            const result = await OrdersService.findAll(1, 50, 'all', clientId);
            setOrders(result.data || []);
        } catch (err) {
            console.error('Failed to load client orders', err);
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        loadClient();
        loadOrders();
    }, [loadClient, loadOrders]);

    if (loading) {
        return <PageLoader label="Chargement du client…" />;
    }

    if (error || !client) {
        return (
            <div className="space-y-4 py-8">
                <Link href="/clients" className="text-sm text-muted-foreground hover:text-foreground">
                    ← Clients
                </Link>
                <p className="text-red-400">{error || 'Client introuvable.'}</p>
            </div>
        );
    }

    const clientName = `${client.first_name} ${client.last_name}`;
    const newOrderHref = `/orders?clientId=${encodeURIComponent(client.id)}&clientName=${encodeURIComponent(clientName)}`;

    return (
        <div className="space-y-8">
            <div>
                <Link href="/clients" className="text-sm text-muted-foreground hover:text-foreground">
                    ← Clients
                </Link>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
                        <p className="mt-1 font-mono text-sm text-muted-foreground">{client.unique_code}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`/clients/${client.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                        >
                            <Pencil className="h-4 w-4" />
                            Modifier
                        </Link>
                        <Link
                            href={newOrderHref}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Nouvelle commande
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-xl border border-border bg-card p-6">
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Téléphone</p>
                    <p className="mt-1 font-medium text-foreground">{client.phone}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                    <p className="mt-1 font-medium text-foreground">{client.email || '—'}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Agence de création</p>
                    <p className="mt-1 font-medium text-foreground">{client.site_name || '—'}</p>
                </div>
                {client.notes ? (
                    <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                        <p className="mt-1 text-foreground whitespace-pre-wrap">{client.notes}</p>
                    </div>
                ) : null}
            </div>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Historique des commandes</h2>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Référence
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Statut
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Total
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Articles
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordersLoading ? (
                                <TableLoadingRow colSpan={5} label="Chargement des commandes…" />
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        Aucune commande pour ce client.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-border/50 last:border-0 hover:bg-muted/50"
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {order.reference || `#${order.id.slice(0, 8)}`}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {order.created_at
                                                ? new Date(order.created_at).toLocaleString('fr-FR')
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusLabel status={order.status} />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {formatMoney(order.total_price)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {order.items_summary || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
