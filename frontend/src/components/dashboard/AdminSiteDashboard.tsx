'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import {
    ShoppingBag,
    CreditCard,
    Clock,
    LayoutGrid,
    Plus,
    AlertCircle,
    CheckCircle2,
    Package,
    ScanLine,
    Truck,
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { OrdersService } from '@/services/orders.service';
import { StorageService } from '@/services/storage.service';
import { SiteService } from '@/services/site.service';
import { getSiteIdFromSession } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTenantConfig } from '@/context/tenant-config.context';
import { Badge } from '@/components/ui/Badge';
import { SiteKpiCard } from '@/components/dashboard/SiteKpiCard';
import {
    computeOccupancyRate,
    deriveOpsQueues,
    normalizeOrdersResponse,
    type DashboardOrder,
    type OpsQueues,
} from '@/components/dashboard/ops-queues';

const serviceLabel = (level?: string) => {
    if (level === 'EXPRESS') return 'Express';
    if (level === 'NORMAL') return 'Standard';
    return level || '—';
};

export function AdminSiteDashboard() {
    const { data: session } = useSession();
    const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);

    const [siteName, setSiteName] = useState<string>('Agence');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ ordersToday: 0, revenueToday: 0, pendingOrders: 0 });
    const [occupancy, setOccupancy] = useState(0);
    const [hourly, setHourly] = useState<Array<{ hour: number; label: string; orders: number }>>([]);
    const [delayedOrders, setDelayedOrders] = useState(0);
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
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const today = format(new Date(), 'yyyy-MM-dd');

            const [
                siteResult,
                statsResult,
                hourlyResult,
                delayedResult,
                slotsResult,
                ordersResult,
            ] = await Promise.allSettled([
                SiteService.getById(siteId),
                OrdersService.getDashboardStats(today, today, timezone, siteId),
                OrdersService.getHourlyStats(siteId, today, timezone),
                OrdersService.getDelayedStats(siteId),
                StorageService.getAll(siteId),
                OrdersService.findAll(1, 100, 'all'),
            ]);

            if (cancelled) return;

            if (siteResult.status === 'fulfilled') {
                setSiteName(siteResult.value.name || 'Agence');
            }

            if (statsResult.status === 'fulfilled') {
                setStats({
                    ordersToday: statsResult.value.ordersToday ?? 0,
                    revenueToday: statsResult.value.revenueToday ?? 0,
                    pendingOrders: statsResult.value.pendingOrders ?? 0,
                });
            } else {
                console.warn('Failed to fetch site dashboard stats:', statsResult.reason);
            }

            if (hourlyResult.status === 'fulfilled' && Array.isArray(hourlyResult.value)) {
                // Business hours 08–20 for chart clarity
                setHourly(hourlyResult.value.filter((h) => h.hour >= 8 && h.hour <= 20));
            } else {
                setHourly([]);
            }

            const delayed =
                delayedResult.status === 'fulfilled'
                    ? delayedResult.value.delayedOrders ?? 0
                    : 0;
            setDelayedOrders(delayed);

            const slots =
                slotsResult.status === 'fulfilled' && Array.isArray(slotsResult.value)
                    ? slotsResult.value
                    : [];
            setOccupancy(computeOccupancyRate(slots).rate);

            const orders = normalizeOrdersResponse(
                ordersResult.status === 'fulfilled' ? ordersResult.value : [],
            );
            const derived = deriveOpsQueues(orders);
            setQueues({ ...derived, delayed });
            setLoading(false);
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [siteId]);

    const { formatMoney } = useTenantConfig();
    const formatCurrency = (amount: number) => formatMoney(amount);

    if (!siteId) {
        return (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                Aucune agence associée à votre compte. Contactez un administrateur.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">Chargement du tableau de bord...</div>
        );
    }

    const tasks: Array<{
        href: string;
        title: string;
        detail: string;
        count: number;
        urgent?: boolean;
        icon: React.ElementType;
    }> = [
                        {
            href: '/workflow',
            title: 'Traiter les commandes',
            detail: `${queues.toProcess} commande${queues.toProcess === 1 ? '' : 's'} à traiter`,
            count: queues.toProcess,
            urgent: delayedOrders > 0,
            icon: Package,
        },
        {
            href: '/storage/scan',
            title: 'Ranger en rayon',
            detail: `${queues.toStore} commande${queues.toStore === 1 ? '' : 's'} prête${queues.toStore === 1 ? '' : 's'} à ranger`,
            count: queues.toStore,
            icon: ScanLine,
        },
        {
            href: '/storage/delivery',
            title: 'Retraits clients',
            detail: `${queues.toDeliver} commande${queues.toDeliver === 1 ? '' : 's'} en casier`,
            count: queues.toDeliver,
            icon: Truck,
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">
                        Dashboard de l&apos;Agence {siteName}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                    </span>
                </div>
                <Link href="/orders">
                    <Button icon={<Plus className="h-4 w-4" />}>Nouvelle commande</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SiteKpiCard
                    label="Commandes du Jour"
                    value={stats.ordersToday}
                    icon={ShoppingBag}
                    subValue={`${stats.pendingOrders} en cours`}
                    trend="neutral"
                />
                <SiteKpiCard
                    label="CA du Jour"
                    value={formatCurrency(stats.revenueToday)}
                    icon={CreditCard}
                />
                <SiteKpiCard
                    label="Commandes en Retard"
                    value={delayedOrders}
                    icon={Clock}
                    alert={delayedOrders > 0}
                    subValue={delayedOrders > 0 ? 'Action Requise' : 'Aucune'}
                    trend={delayedOrders > 0 ? 'alert' : 'neutral'}
                />
                <SiteKpiCard
                    label="Taux d'Occupation"
                    value={`${occupancy}%`}
                    icon={LayoutGrid}
                    progress={occupancy}
                    subValue={occupancy >= 90 ? 'Quasi saturé' : undefined}
                    trend={occupancy >= 90 ? 'alert' : 'neutral'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-border">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Activité Horaire</h3>
                            <p className="text-sm text-muted-foreground">
                                Flux de commandes par heure
                            </p>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground px-2.5 py-1 rounded-lg border border-border">
                            Aujourd&apos;hui
                        </span>
                    </div>
                    <div className="h-64 w-full">
                        {hourly.length === 0 || hourly.every((d) => d.orders === 0) ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                Aucune activité sur cette période.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourly} barSize={28}>
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: '1px solid #334155',
                                            background: '#1E293B',
                                            color: '#F8FAFC',
                                        }}
                                        formatter={(value: number | undefined) => [
                                            `${value ?? 0}`,
                                            'Commandes',
                                        ]}
                                    />
                                    <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                                        {hourly.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill="#3B82F6" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                <Card className="border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        À faire aujourd&apos;hui
                    </h3>
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <Link
                                key={task.href}
                                href={task.href}
                                className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors duration-150"
                            >
                                <div className="p-2 rounded-lg bg-muted shrink-0">
                                    <task.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-foreground">
                                            {task.title}
                                        </p>
                                        {task.urgent && (
                                            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                                                Urgent
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {task.detail}
                                    </p>
                                </div>
                                <span className="text-lg font-bold text-foreground tabular-nums">
                                    {task.count}
                                </span>
                            </Link>
                        ))}

                        {delayedOrders > 0 && (
                            <div className="mt-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-300">
                                    {delayedOrders} commande
                                    {delayedOrders === 1 ? '' : 's'} hors SLA (échéance dépassée).
                                </p>
                            </div>
                        )}

                        {tasks.every((t) => t.count === 0) && delayedOrders === 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                Rien à traiter pour le moment.
                            </div>
                        )}
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
                                <th className="px-6 py-4">Service</th>
                                <th className="px-6 py-4">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queues.recent.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        Aucune commande récente.
                                    </td>
                                </tr>
                            ) : (
                                queues.recent.map((order: DashboardOrder) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-100"
                                    >
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/orders/${order.id}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {order.reference || `#${order.id.slice(0, 8)}`}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {order.client_name || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {serviceLabel(order.service_level)}
                                            {order.service_level === 'EXPRESS' && (
                                                <span className="ml-2">
                                                    <Badge express />
                                                </span>
                                            )}
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
