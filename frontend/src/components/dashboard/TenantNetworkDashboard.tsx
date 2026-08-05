'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { OrdersService } from '@/services/orders.service';
import { StorageService } from '@/services/storage.service';
import { ExpenseService } from '@/services/expense.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    ShoppingBag,
    CreditCard,
    Clock,
    TrendingUp,
    Plus,
    Search,
    Bell,
    AlertCircle,
    MoreHorizontal,
    Store,
    Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useTenantConfig } from '@/context/tenant-config.context';
import { DateRange } from 'react-day-picker';
import { AgencySelector, type AgencyOption } from '@/components/ui/agency-selector';
import { ContentLoader } from '@/components/ui/loading';

type SiteStatRow = {
    siteId: string;
    siteName: string;
    revenue: number;
    orders: number;
    activeOrders: number;
    occupancy: number;
};

export function TenantNetworkDashboard() {
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });
    const [selectedAgency, setSelectedAgency] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        ordersToday: 0,
        revenueToday: 0,
        pendingOrders: 0,
    });
    const [delayedOrders, setDelayedOrders] = useState(0);
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [agencies, setAgencies] = useState<SiteStatRow[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const agencyOptions: AgencyOption[] = useMemo(
        () => [
            { value: 'all', label: 'Toutes les agences' },
            ...agencies.map((a) => ({ value: a.siteId, label: a.siteName })),
        ],
        [agencies],
    );

    const handleDateChange = (range: DateRange | undefined) => {
        if (range?.from) {
            setDateRange({
                startDate: format(range.from, 'yyyy-MM-dd'),
                endDate: range.to
                    ? format(range.to, 'yyyy-MM-dd')
                    : format(range.from, 'yyyy-MM-dd'),
            });
        }
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const siteId = selectedAgency === 'all' ? undefined : selectedAgency;

            const [statsResult, bySiteResult, delayedResult, occupancyResult, expensesResult] =
                await Promise.allSettled([
                    OrdersService.getDashboardStats(
                        dateRange.startDate,
                        dateRange.endDate,
                        timezone,
                        siteId,
                    ),
                    OrdersService.getStatsBySite(
                        dateRange.startDate,
                        dateRange.endDate,
                        timezone,
                    ),
                    OrdersService.getDelayedStats(siteId),
                    StorageService.getOccupancyBySite(),
                    ExpenseService.getTotal({
                        siteId,
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate,
                    }),
                ]);

            if (cancelled) return;

            if (statsResult.status === 'fulfilled') {
                setStats({
                    ordersToday: statsResult.value.ordersToday ?? 0,
                    revenueToday: statsResult.value.revenueToday ?? 0,
                    pendingOrders: statsResult.value.pendingOrders ?? 0,
                });
            }

            const occupancyMap = new Map<string, number>();
            if (occupancyResult.status === 'fulfilled' && Array.isArray(occupancyResult.value)) {
                for (const row of occupancyResult.value) {
                    occupancyMap.set(row.siteId, row.rate);
                }
            }

            if (bySiteResult.status === 'fulfilled' && Array.isArray(bySiteResult.value)) {
                setAgencies(
                    bySiteResult.value.map((row) => ({
                        ...row,
                        occupancy: occupancyMap.get(row.siteId) ?? 0,
                    })),
                );
            } else {
                setAgencies([]);
            }

            if (delayedResult.status === 'fulfilled') {
                setDelayedOrders(delayedResult.value.delayedOrders ?? 0);
            } else {
                setDelayedOrders(0);
            }

            if (expensesResult.status === 'fulfilled') {
                setExpensesTotal(expensesResult.value.total ?? 0);
            } else {
                setExpensesTotal(0);
            }

            setLoading(false);
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [dateRange, selectedAgency]);

    const { formatMoney } = useTenantConfig();
    const formatCurrency = (amount: number) => formatMoney(amount);

    const chartData = useMemo(() => {
        const rows =
            selectedAgency === 'all'
                ? agencies
                : agencies.filter((a) => a.siteId === selectedAgency);
        return rows.map((a) => ({
            name: a.siteName.length > 14 ? `${a.siteName.slice(0, 12)}…` : a.siteName,
            fullName: a.siteName,
            revenue: a.revenue,
        }));
    }, [agencies, selectedAgency]);

    const tableRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return agencies.filter((a) => {
            if (selectedAgency !== 'all' && a.siteId !== selectedAgency) return false;
            if (!q) return true;
            return a.siteName.toLowerCase().includes(q);
        });
    }, [agencies, selectedAgency, searchQuery]);

    const occupancyAlerts = useMemo(
        () => agencies.filter((a) => a.occupancy >= 90),
        [agencies],
    );

    const avgOccupancy = useMemo(() => {
        if (agencies.length === 0) return 0;
        const sum = agencies.reduce((s, a) => s + a.occupancy, 0);
        return Math.round(sum / agencies.length);
    }, [agencies]);

    const exportReport = () => {
        const header = ['Agence', 'CA', 'Commandes', 'Commandes actives', 'Occupation %'];
        const lines = tableRows.map((a) =>
            [a.siteName, a.revenue, a.orders, a.activeOrders, a.occupancy].join(';'),
        );
        const csv = [header.join(';'), ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-reseau-${dateRange.startDate}_${dateRange.endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Aperçu du Réseau</h1>
                    <p className="text-sm text-muted-foreground">
                        Performances réelles de vos agences sur la période sélectionnée.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="icon" className="rounded-full shadow-sm">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <Link href="/agencies">
                        <Button icon={<Plus className="h-4 w-4" />}>Gérer les agences</Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border border-border">
                <DatePickerWithRange
                    date={{
                        from: new Date(dateRange.startDate),
                        to: new Date(dateRange.endDate),
                    }}
                    setDate={handleDateChange}
                />
                <AgencySelector
                    value={selectedAgency}
                    agencies={agencyOptions}
                    onSelect={setSelectedAgency}
                />
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une agence..."
                        className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-xl text-sm border border-border focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {loading ? (
                <ContentLoader label="Chargement du réseau…" className="p-8" />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                label: "Chiffre d'Affaires",
                                value: formatCurrency(stats.revenueToday),
                                sub: `${stats.pendingOrders} commandes en cours`,
                                icon: CreditCard,
                                trend: 'up' as const,
                            },
                            {
                                label: 'Dépenses',
                                value: formatCurrency(expensesTotal),
                                sub: 'Période sélectionnée',
                                icon: ShoppingBag,
                                trend: 'neutral' as const,
                            },
                            {
                                label: 'Marge nette',
                                value: formatCurrency(stats.revenueToday - expensesTotal),
                                sub: delayedOrders > 0 ? `${delayedOrders} retard(s) SLA` : 'CA − dépenses',
                                icon: TrendingUp,
                                trend: stats.revenueToday - expensesTotal >= 0 ? ('up' as const) : ('alert' as const),
                            },
                            {
                                label: 'Nouvelles Commandes',
                                value: stats.ordersToday,
                                sub: `Occupation moy. ${avgOccupancy}%`,
                                icon: Clock,
                                trend: 'up' as const,
                            },
                        ].map((kpi, idx) => (
                            <Card
                                key={idx}
                                padding="lg"
                                className={`flex flex-col justify-between border-border hover:border-primary/30 transition-all duration-150 ${
                                    'alert' in kpi && kpi.alert ? 'border-amber-500/50' : ''
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {kpi.label}
                                        </p>
                                        <h3 className="text-3xl font-bold text-foreground mt-1">
                                            {kpi.value}
                                        </h3>
                                    </div>
                                    <div className="p-2 bg-muted rounded-full">
                                        <kpi.icon className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                                <span
                                    className={`inline-flex mt-4 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        kpi.trend === 'up'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : kpi.trend === 'alert'
                                              ? 'bg-amber-500/10 text-amber-400'
                                              : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {kpi.sub}
                                </span>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-border">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Comparatif CA par Agence
                                </h3>
                                <Link
                                    href="/agencies"
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Détails complets ›
                                </Link>
                            </div>
                            <div className="h-64 w-full">
                                {chartData.length === 0 ||
                                chartData.every((d) => d.revenue === 0) ? (
                                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                        Aucun CA sur cette période.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} barSize={40}>
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                                dy={10}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{
                                                    borderRadius: '8px',
                                                    border: '1px solid #334155',
                                                    background: '#1E293B',
                                                    color: '#F8FAFC',
                                                }}
                                                formatter={(value: number | undefined) => [
                                                    formatCurrency(value ?? 0),
                                                    'CA',
                                                ]}
                                            />
                                            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                                {chartData.map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={index === 0 ? '#3B82F6' : '#64748B'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </Card>

                        <Card className="border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-6">
                                Taux d&apos;Occupation
                            </h3>
                            <div className="space-y-6">
                                {(selectedAgency === 'all'
                                    ? agencies.slice(0, 5)
                                    : agencies.filter((a) => a.siteId === selectedAgency)
                                ).map((item) => (
                                    <div key={item.siteId}>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-foreground truncate pr-2">
                                                {item.siteName}
                                            </span>
                                            <span className="text-muted-foreground shrink-0">
                                                {item.occupancy}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    item.occupancy >= 90
                                                        ? 'bg-amber-500'
                                                        : 'bg-primary'
                                                }`}
                                                style={{ width: `${item.occupancy}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {agencies.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Aucune donnée d&apos;occupation.
                                    </p>
                                )}
                            </div>

                            {occupancyAlerts.length > 0 && (
                                <div className="mt-8 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                                            Alertes Opérationnelles
                                        </p>
                                        <p className="text-sm text-amber-300 mt-1">
                                            Capacité quasi saturée :{' '}
                                            {occupancyAlerts
                                                .map((a) => `${a.siteName} (${a.occupancy}%)`)
                                                .join(', ')}
                                            .
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    <Card className="border-border overflow-hidden" padding="none">
                        <div className="p-6 flex justify-between items-center border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">
                                Résumé Opérationnel des Agences
                            </h3>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Download className="h-4 w-4" />}
                                onClick={exportReport}
                                disabled={tableRows.length === 0}
                            >
                                Exporter rapport
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Nom de l&apos;Agence</th>
                                        <th className="px-6 py-4">CA période</th>
                                        <th className="px-6 py-4">Commandes Actives</th>
                                        <th className="px-6 py-4">Occupation Rayon</th>
                                        <th className="px-6 py-4">Statut</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-6 py-8 text-center text-muted-foreground"
                                            >
                                                Aucune agence à afficher.
                                            </td>
                                        </tr>
                                    ) : (
                                        tableRows.map((agency) => {
                                            const overloaded = agency.occupancy >= 90;
                                            return (
                                                <tr
                                                    key={agency.siteId}
                                                    className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-100"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                                <Store className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-semibold text-foreground">
                                                                {agency.siteName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {formatCurrency(agency.revenue)}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {agency.activeOrders}
                                                    </td>
                                                    <td className="px-6 py-4 w-48">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${
                                                                        overloaded
                                                                            ? 'bg-amber-500'
                                                                            : 'bg-primary'
                                                                    }`}
                                                                    style={{
                                                                        width: `${agency.occupancy}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                {agency.occupancy}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                overloaded
                                                                    ? 'bg-amber-500/10 text-amber-400'
                                                                    : 'bg-emerald-500/10 text-emerald-400'
                                                            }`}
                                                        >
                                                            {overloaded
                                                                ? 'SURCHARGÉ'
                                                                : 'OPÉRATIONNEL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Link
                                                            href={`/agencies/${agency.siteId}`}
                                                            className="text-muted-foreground hover:text-foreground transition-colors duration-150 inline-flex"
                                                        >
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
