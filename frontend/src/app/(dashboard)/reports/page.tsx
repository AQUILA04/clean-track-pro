'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    format,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    subDays,
} from 'date-fns';
import {
    Download,
    FileDown,
    Wallet,
    ShoppingBag,
    Clock,
    CheckCircle2,
    TrendingUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
} from 'recharts';
import { OrdersService } from '@/services/orders.service';
import { ExpenseService } from '@/services/expense.service';
import { StorageService } from '@/services/storage.service';
import { SiteService, type Site } from '@/services/site.service';
import { serviceDefinitionService } from '@/services/service-definition.service';
import type { ServiceDefinition } from '@/types/service-definition';
import { getSessionRoles, hasAnyRole, getSiteIdFromSession } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SiteKpiCard } from '@/components/dashboard/SiteKpiCard';
import { useToast } from '@/components/ui/simple-toast';
import { useTenantConfig } from '@/context/tenant-config.context';

type PeriodPreset = 'today' | 'lastWeek' | 'last30' | 'custom';

type AgencyRow = {
    siteId: string;
    siteName: string;
    revenue: number;
    orders: number;
    activeOrders: number;
    occupancy: number;
    efficiency: number;
    status: 'EXCELLENT' | 'STABLE' | 'ALERTE';
};

function periodRange(preset: PeriodPreset): { start: string; end: string } {
    const now = new Date();
    if (preset === 'today') {
        return {
            start: format(startOfDay(now), 'yyyy-MM-dd'),
            end: format(endOfDay(now), 'yyyy-MM-dd'),
        };
    }
    if (preset === 'lastWeek') {
        const lastWeekEnd = subDays(startOfWeek(now, { weekStartsOn: 1 }), 1);
        const lastWeekStart = startOfWeek(lastWeekEnd, { weekStartsOn: 1 });
        return {
            start: format(lastWeekStart, 'yyyy-MM-dd'),
            end: format(endOfWeek(lastWeekEnd, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
    }
    // last 30 days
    return {
        start: format(subDays(now, 29), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
    };
}

function statusFromMetrics(efficiency: number, occupancy: number): AgencyRow['status'] {
    if (efficiency >= 85 && occupancy < 90) return 'EXCELLENT';
    if (efficiency < 60 || occupancy >= 95) return 'ALERTE';
    return 'STABLE';
}

export default function ReportsPage() {
    const { toast } = useToast();
    const { formatMoney } = useTenantConfig();
    const formatCurrency = (value: number) => formatMoney(value);
    const { data: session } = useSession();
    const roles = getSessionRoles(session?.user);
    const isTenantAdmin = hasAnyRole(roles, ['Admin_Tenant', 'Superadmin', 'Super_Admin']);
    const sessionSiteId = getSiteIdFromSession(
        session?.user as Record<string, unknown> | undefined,
    );

    const reportRef = useRef<HTMLDivElement>(null);

    const initial = periodRange('last30');
    const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last30');
    const [startDate, setStartDate] = useState(initial.start);
    const [endDate, setEndDate] = useState(initial.end);
    const [filterSiteId, setFilterSiteId] = useState('');
    const [filterServiceId, setFilterServiceId] = useState('');
    const [services, setServices] = useState<ServiceDefinition[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportingPdf, setExportingPdf] = useState(false);

    const [revenue, setRevenue] = useState(0);
    const [ordersCount, setOrdersCount] = useState(0);
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [avgHours, setAvgHours] = useState(0);
    const [completionRate, setCompletionRate] = useState(0);
    const [delayedOrders, setDelayedOrders] = useState(0);
    const [chartData, setChartData] = useState<
        Array<{ label: string; revenus: number; depenses: number }>
    >([]);
    const [serviceBars, setServiceBars] = useState<
        Array<{ label: string; orders: number; pct: number }>
    >([]);
    const [agencies, setAgencies] = useState<AgencyRow[]>([]);
    const [occupancyAvg, setOccupancyAvg] = useState(0);

    const effectiveSiteId = isTenantAdmin
        ? filterSiteId || undefined
        : sessionSiteId || undefined;

    const timezone = useMemo(
        () => Intl.DateTimeFormat().resolvedOptions().timeZone,
        [],
    );

    useEffect(() => {
        serviceDefinitionService
            .findAll()
            .then((list) => setServices(list.filter((s) => s.is_active !== false)))
            .catch((err) => {
                console.error(err);
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger les services.',
                    variant: 'destructive',
                });
            });
    }, [toast]);

    useEffect(() => {
        if (!isTenantAdmin) return;
        SiteService.getAll()
            .then(setSites)
            .catch((err) => console.error(err));
    }, [isTenantAdmin]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const siteId = effectiveSiteId;
            const serviceId = filterServiceId || undefined;

            const [
                dash,
                expenses,
                orderSeries,
                expenseSeries,
                throughput,
                byService,
                bySite,
                occupancy,
            ] = await Promise.all([
                OrdersService.getDashboardStats(
                    startDate,
                    endDate,
                    timezone,
                    siteId,
                    serviceId,
                ),
                ExpenseService.getTotal({ siteId, startDate, endDate }),
                OrdersService.getTimeseriesStats(startDate, endDate, {
                    siteId,
                    serviceId,
                    timezone,
                }),
                ExpenseService.getTimeseries({ siteId, startDate, endDate }),
                OrdersService.getThroughputStats(startDate, endDate, {
                    siteId,
                    serviceId,
                    timezone,
                }),
                OrdersService.getStatsByService(startDate, endDate, { siteId, timezone }),
                isTenantAdmin
                    ? OrdersService.getStatsBySite(startDate, endDate, timezone)
                    : Promise.resolve([]),
                StorageService.getOccupancyBySite().catch(() => []),
            ]);

            const nextCompletion = throughput.completionRate ?? 0;

            setRevenue(dash.revenueToday ?? 0);
            setOrdersCount(dash.ordersToday ?? 0);
            setExpensesTotal(expenses.total ?? 0);
            setAvgHours(throughput.avgHours ?? 0);
            setCompletionRate(nextCompletion);
            setDelayedOrders(throughput.delayedOrders ?? 0);

            const expenseMap = new Map(expenseSeries.map((e) => [e.date, e.total]));
            setChartData(
                orderSeries.map((o) => ({
                    label: o.label,
                    revenus: o.revenue,
                    depenses: expenseMap.get(o.date) ?? 0,
                })),
            );

            const maxSvc = Math.max(1, ...byService.map((s) => s.orders));
            setServiceBars(
                byService.slice(0, 6).map((s) => ({
                    label: s.label,
                    orders: s.orders,
                    pct: Math.round((s.orders / maxSvc) * 100),
                })),
            );

            const occMap = new Map(
                (occupancy || []).map((r: { siteId: string; rate: number }) => [
                    r.siteId,
                    r.rate,
                ]),
            );
            const occValues = [...occMap.values()];
            setOccupancyAvg(
                occValues.length
                    ? Math.round(occValues.reduce((a, b) => a + b, 0) / occValues.length)
                    : 0,
            );

            if (isTenantAdmin) {
                setAgencies(
                    bySite.map((row) => {
                        const occ = occMap.get(row.siteId) ?? 0;
                        const efficiency =
                            row.orders > 0
                                ? Math.min(
                                      100,
                                      Math.round(
                                          ((row.orders - Math.min(row.activeOrders, row.orders)) /
                                              row.orders) *
                                              100,
                                      ),
                                  )
                                : nextCompletion;
                        return {
                            ...row,
                            occupancy: occ,
                            efficiency,
                            status: statusFromMetrics(efficiency, occ),
                        };
                    }),
                );
            } else {
                setAgencies([]);
            }
        } catch (err) {
            console.error(err);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les rapports.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [
        startDate,
        endDate,
        effectiveSiteId,
        filterServiceId,
        timezone,
        isTenantAdmin,
        toast,
    ]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const applyPreset = (preset: PeriodPreset) => {
        setPeriodPreset(preset);
        if (preset === 'custom') return;
        const range = periodRange(preset);
        setStartDate(range.start);
        setEndDate(range.end);
    };

    const margin = revenue - expensesTotal;
    const delayRate =
        ordersCount > 0 ? Math.round((delayedOrders / Math.max(ordersCount, 1)) * 100) : 0;

    const handleExportCsv = () => {
        const rows = [
            ['Indicateur', 'Valeur'],
            ['Période début', startDate],
            ['Période fin', endDate],
            ['Chiffre d\'affaires', String(revenue)],
            ['Commandes', String(ordersCount)],
            ['Dépenses', String(expensesTotal)],
            ['Marge', String(margin)],
            ['Temps moyen (h)', String(avgHours)],
            ['Taux de complétion (%)', String(completionRate)],
            ...agencies.map((a) => [
                a.siteName,
                `${a.revenue};${a.orders};${a.efficiency}%;${a.status}`,
            ]),
        ];
        const csv = rows.map((r) => r.join(';')).join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_${startDate}_${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = async () => {
        if (!reportRef.current) return;
        setExportingPdf(true);
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf'),
            ]);
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#0B1120',
                useCORS: true,
            });
            const img = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            pdf.addImage(img, 'PNG', 0, position, pageWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(img, 'PNG', 0, position, pageWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save(`rapport_${startDate}_${endDate}.pdf`);
            toast({
                title: 'PDF généré',
                description: 'Le rapport a été téléchargé.',
                variant: 'success',
            });
        } catch (err) {
            console.error(err);
            toast({
                title: 'Erreur PDF',
                description: 'Impossible de générer le PDF.',
                variant: 'destructive',
            });
        } finally {
            setExportingPdf(false);
        }
    };

    const agencyOptions = sites.map((a) => ({ id: a.id, name: a.name }));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Rapports de Performance</h1>
                    <p className="text-sm text-muted-foreground">
                        Analyse consolidée du chiffre d&apos;affaires, des opérations et des
                        agences.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        icon={<Download className="h-4 w-4" />}
                        onClick={handleExportCsv}
                    >
                        Exporter CSV
                    </Button>
                    <Button
                        icon={<FileDown className="h-4 w-4" />}
                        onClick={handleExportPdf}
                        isLoading={exportingPdf}
                    >
                        Exporter en PDF
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border">
                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            { id: 'today' as const, label: "Aujourd'hui" },
                            { id: 'lastWeek' as const, label: 'Semaine dernière' },
                            { id: 'last30' as const, label: '30 derniers jours' },
                        ] as const
                    ).map((chip) => (
                        <button
                            key={chip.id}
                            type="button"
                            onClick={() => applyPreset(chip.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                periodPreset === chip.id
                                    ? 'bg-primary text-white'
                                    : 'border border-border text-muted-foreground hover:bg-muted/50'
                            }`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="text-xs text-muted-foreground">Du</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setPeriodPreset('custom');
                                setStartDate(e.target.value);
                            }}
                            className="block mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Au</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setPeriodPreset('custom');
                                setEndDate(e.target.value);
                            }}
                            className="block mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm"
                        />
                    </div>
                    {isTenantAdmin && (
                        <div>
                            <label className="text-xs text-muted-foreground">Agence</label>
                            <select
                                value={filterSiteId}
                                onChange={(e) => setFilterSiteId(e.target.value)}
                                className="block mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm min-w-[180px]"
                            >
                                <option value="">Toutes les agences</option>
                                {agencyOptions.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div ref={reportRef} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <SiteKpiCard
                        label="Chiffre d'Affaires"
                        value={loading ? '…' : formatCurrency(revenue)}
                        icon={Wallet}
                        subValue={`Marge ${formatCurrency(margin)}`}
                        trend={margin >= 0 ? 'up' : 'alert'}
                    />
                    <SiteKpiCard
                        label="Commandes traitées"
                        value={loading ? '…' : ordersCount}
                        icon={ShoppingBag}
                        subValue={`${expensesTotal > 0 ? formatCurrency(expensesTotal) + ' de dépenses' : 'Aucune dépense'}`}
                        trend="neutral"
                    />
                    <SiteKpiCard
                        label="Temps moyen"
                        value={loading ? '…' : `${avgHours} h`}
                        icon={Clock}
                        subValue="Création → prêt / livré"
                        trend={avgHours <= 4 ? 'up' : 'alert'}
                    />
                    <SiteKpiCard
                        label="Taux de complétion"
                        value={loading ? '…' : `${completionRate} %`}
                        icon={CheckCircle2}
                        subValue={`${delayedOrders} en retard`}
                        progress={completionRate}
                        trend={completionRate >= 80 ? 'up' : 'alert'}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card className="xl:col-span-2 border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">
                                    Rapport financier
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Revenus vs dépenses opérationnelles
                                </p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div className="h-72">
                            {loading ? (
                                <div className="h-full animate-pulse rounded-xl bg-muted/40" />
                            ) : chartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                    Aucune donnée sur cette période.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barGap={4}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: '#94A3B8', fontSize: 11 }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1E293B',
                                                border: '1px solid #334155',
                                                borderRadius: 8,
                                            }}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="revenus"
                                            name="Revenus"
                                            fill="#3B82F6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="depenses"
                                            name="Dépenses"
                                            fill="#94A3B8"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    <Card className="border-border">
                        <h2 className="text-lg font-semibold text-foreground mb-1">
                            Indicateurs ops
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Efficacité sur la période
                        </p>
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Délai moyen</span>
                                    <span className="font-semibold text-foreground">
                                        {avgHours} h
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{
                                            width: `${Math.min(100, (avgHours / 8) * 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Objectif : &lt; 4,0 h
                                </p>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">
                                        Taux de complétion
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {completionRate} %
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${completionRate}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">
                                        Occupation rayons
                                    </span>
                                    <span className="font-semibold text-foreground">
                                        {occupancyAvg} %
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            occupancyAvg >= 90 ? 'bg-amber-500' : 'bg-primary'
                                        }`}
                                        style={{ width: `${occupancyAvg}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">Retards SLA</span>
                                    <span className="font-semibold text-foreground">
                                        {delayRate} %
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full"
                                        style={{ width: `${Math.min(100, delayRate)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Rapport opérationnel
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Volume par type de service (catalogue tenant)
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setFilterServiceId('')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                    !filterServiceId
                                        ? 'bg-primary text-white'
                                        : 'border border-border text-muted-foreground'
                                }`}
                            >
                                Tous les services
                            </button>
                            {services.map((svc) => (
                                <button
                                    key={svc.id}
                                    type="button"
                                    onClick={() => setFilterServiceId(svc.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                        filterServiceId === svc.id
                                            ? 'bg-primary text-white'
                                            : 'border border-border text-muted-foreground'
                                    }`}
                                >
                                    {svc.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {serviceBars.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            Aucun volume par service sur cette période.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {serviceBars.map((bar) => (
                                <div key={bar.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-foreground font-medium">
                                            {bar.label}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {bar.orders} cmd
                                        </span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-primary/80 rounded-full"
                                            style={{ width: `${bar.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {isTenantAdmin && (
                    <Card className="border-border overflow-hidden" padding="none">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">
                                Performance par agence
                            </h2>
                            <Link
                                href="/dashboard"
                                className="text-sm text-primary hover:underline"
                            >
                                Voir tout
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase text-muted-foreground tracking-wide border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3">Agence</th>
                                        <th className="px-6 py-3">Revenu</th>
                                        <th className="px-6 py-3">Volume</th>
                                        <th className="px-6 py-3">Efficacité</th>
                                        <th className="px-6 py-3">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-8 text-center text-muted-foreground"
                                            >
                                                Chargement…
                                            </td>
                                        </tr>
                                    ) : agencies.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-6 py-8 text-center text-muted-foreground"
                                            >
                                                Aucune agence.
                                            </td>
                                        </tr>
                                    ) : (
                                        agencies.map((row) => (
                                            <tr
                                                key={row.siteId}
                                                className="border-b border-border/50 hover:bg-muted/30"
                                            >
                                                <td className="px-6 py-4 font-medium text-foreground">
                                                    {row.siteName}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {formatCurrency(row.revenue)}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {row.orders} cmd
                                                </td>
                                                <td className="px-6 py-4 min-w-[160px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary rounded-full"
                                                                style={{
                                                                    width: `${row.efficiency}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs tabular-nums">
                                                            {row.efficiency}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            row.status === 'EXCELLENT'
                                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                                : row.status === 'ALERTE'
                                                                  ? 'bg-amber-500/10 text-amber-400'
                                                                  : 'bg-blue-500/10 text-blue-400'
                                                        }`}
                                                    >
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
