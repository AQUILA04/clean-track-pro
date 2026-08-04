'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
    ShoppingBag,
    Package,
    ScanLine,
    Truck,
    Banknote,
    LayoutGrid,
    Workflow,
} from 'lucide-react';
import { OrdersService } from '@/services/orders.service';
import { StorageService } from '@/services/storage.service';
import { getSiteIdFromSession } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    computeOccupancyRate,
    deriveOpsQueues,
    normalizeOrdersResponse,
    type DashboardOrder,
    type OpsQueues,
} from '@/components/dashboard/ops-queues';

const shortcuts = [
    { href: '/orders', label: 'Nouvelle commande', icon: ShoppingBag },
    { href: '/workflow', label: 'Workflow', icon: Workflow },
    { href: '/storage/scan', label: 'Rangement', icon: ScanLine },
    { href: '/storage/delivery', label: 'Livraison', icon: Truck },
    { href: '/cash-register', label: 'Ma Caisse', icon: Banknote },
];

export function UserSiteOpsHome() {
    const { data: session } = useSession();
    const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);

    const [loading, setLoading] = useState(true);
    const [occupancy, setOccupancy] = useState(0);
    const [queues, setQueues] = useState<OpsQueues>({
        toProcess: 0,
        toStore: 0,
        toDeliver: 0,
        delayed: 0,
        recent: [],
    });

    useEffect(() => {
        if (!siteId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            const [slotsResult, ordersResult] = await Promise.allSettled([
                StorageService.getAll(siteId),
                OrdersService.findAll(1, 100, 'all'),
            ]);

            if (cancelled) return;

            const slots =
                slotsResult.status === 'fulfilled' && Array.isArray(slotsResult.value)
                    ? slotsResult.value
                    : [];
            setOccupancy(computeOccupancyRate(slots).rate);

            const orders = normalizeOrdersResponse(
                ordersResult.status === 'fulfilled' ? ordersResult.value : [],
            );
            setQueues(deriveOpsQueues(orders));
            setLoading(false);
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [siteId]);

    if (!siteId) {
        return (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                Aucune agence associée à votre compte. Contactez un administrateur.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        );
    }

    const counters = [
        {
            href: '/workflow',
            label: 'À traiter',
            value: queues.toProcess,
            icon: Package,
        },
        {
            href: '/storage/scan',
            label: 'À ranger',
            value: queues.toStore,
            icon: ScanLine,
        },
        {
            href: '/storage/delivery',
            label: 'À livrer',
            value: queues.toDeliver,
            icon: Truck,
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Accueil opérationnel</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Vos files du jour — passez à l&apos;action en un clic.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {counters.map((c) => (
                    <Link key={c.href} href={c.href}>
                        <Card className="border-border hover:border-primary/40 transition-all duration-150 h-full">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {c.label}
                                    </p>
                                    <p className="text-3xl font-bold text-foreground mt-1">
                                        {c.value}
                                    </p>
                                </div>
                                <div className="p-2 bg-muted rounded-full">
                                    <c.icon className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-border lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Occupation rayons</h3>
                        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-3">{occupancy}%</p>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4">
                        <div
                            className={`h-full rounded-full ${
                                occupancy >= 90 ? 'bg-amber-500' : 'bg-primary'
                            }`}
                            style={{ width: `${occupancy}%` }}
                        />
                    </div>
                    <Link
                        href="/storage"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Voir les rayons
                    </Link>
                </Card>

                <Card className="border-border lg:col-span-2">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Raccourcis</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {shortcuts.map((s) => (
                            <Link
                                key={s.href}
                                href={s.href}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors duration-150 text-center"
                            >
                                <div className="p-2 bg-muted rounded-lg">
                                    <s.icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-foreground">{s.label}</span>
                            </Link>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="border-border overflow-hidden" padding="none">
                <div className="p-6 flex justify-between items-center border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Dernières commandes</h3>
                    <Link
                        href="/orders/active"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Voir tout
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-border text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queues.recent.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        Aucune commande active.
                                    </td>
                                </tr>
                            ) : (
                                queues.recent.map((order: DashboardOrder) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-100"
                                    >
                                        <td className="px-6 py-4 font-medium text-primary font-mono">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="hover:underline"
                                            >
                                                {order.reference || `#${order.id.slice(0, 8)}`}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {order.client_name || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={order.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
