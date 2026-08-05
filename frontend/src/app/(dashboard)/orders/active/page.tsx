'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Filter, Plus, RefreshCw, Search, X } from 'lucide-react';
import { OrdersService } from '@/services/orders.service';
import { formatOrderLabel } from '@/lib/order-display';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { resolveDisplayOrderStatus } from '@/lib/status-labels';
import { Button } from '@/components/ui/Button';
import { useFormatMoney } from '@/context/tenant-config.context';
import { ContentLoader } from '@/components/ui/loading';

type StatusFilter = 'all' | 'ready' | 'processing' | 'late';

interface OrderRow {
    id: string;
    reference?: string | null;
    client_name: string;
    client_phone?: string | null;
    items_count?: number;
    items_summary?: string;
    due_date: string;
    status: string;
    total_price: number;
    service_level?: string;
    created_at: string;
    is_late?: boolean;
}

interface Counts {
    all: number;
    ready: number;
    processing: number;
    late: number;
}

const AVATAR_COLORS = [
    'bg-violet-500/20 text-violet-300',
    'bg-sky-500/20 text-sky-300',
    'bg-emerald-500/20 text-emerald-300',
    'bg-amber-500/20 text-amber-300',
    'bg-rose-500/20 text-rose-300',
    'bg-indigo-500/20 text-indigo-300',
];

function clientInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[hash];
}

function buildPageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages));
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result: Array<number | 'ellipsis'> = [];
    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis');
        result.push(sorted[i]);
    }
    return result;
}

export default function OrdersHistoryPage() {
    const formatMoney = useFormatMoney();
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [counts, setCounts] = useState<Counts>({ all: 0, ready: 0, processing: 0, late: 0 });
    const limit = 15;

    const fetchOrders = useCallback(async (pageNum: number, filter: StatusFilter, q: string) => {
        setLoading(true);
        try {
            const result = await OrdersService.findAll(pageNum, limit, 'all', undefined, {
                status: filter,
                q: q || undefined,
            });
            setOrders(result.data || []);
            setPage(result.meta?.page ?? pageNum);
            setTotal(result.meta?.total ?? 0);
            setTotalPages(result.meta?.totalPages ?? 0);
            if (result.meta?.counts) {
                setCounts(result.meta.counts);
            }
        } catch (error) {
            console.error('Failed to fetch orders', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(page, statusFilter, search);
    }, [fetchOrders, page, statusFilter, search]);

    useEffect(() => {
        const t = setTimeout(() => {
            const next = searchInput.trim();
            setSearch((prev) => {
                if (prev !== next) setPage(1);
                return next;
            });
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const chips: Array<{ key: StatusFilter; label: string; count: number }> = [
        { key: 'all', label: 'Toutes les commandes', count: counts.all },
        { key: 'ready', label: 'Prêtes', count: counts.ready },
        { key: 'processing', label: 'En cours', count: counts.processing },
        { key: 'late', label: 'En retard', count: counts.late },
    ];

    const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);
    const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
    const rangeEnd = Math.min(page * limit, total);

    const clearFilters = () => {
        setStatusFilter('all');
        setSearchInput('');
        setSearch('');
        setPage(1);
    };

    const hasActiveFilters = statusFilter !== 'all' || !!search;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Commandes agence</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Historique des commandes, des plus récentes aux plus anciennes.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchOrders(page, statusFilter, search)}
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

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Rechercher une commande (réf., client, téléphone)…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Filtres</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {chips.map((chip) => {
                    const active = statusFilter === chip.key;
                    return (
                        <button
                            key={chip.key}
                            type="button"
                            onClick={() => {
                                setStatusFilter(chip.key);
                                setPage(1);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                                active
                                    ? 'bg-primary text-white'
                                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                        >
                            {chip.label} ({chip.count})
                        </button>
                    );
                })}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-primary hover:underline"
                    >
                        <X className="h-3.5 w-3.5" />
                        Effacer les filtres
                    </button>
                )}
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                {loading ? (
                    <ContentLoader label="Chargement des commandes…" />
                ) : orders.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">Aucune commande trouvée.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        N° commande
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Client
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Date réception
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Articles
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Statut
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const name = order.client_name || 'Client inconnu';
                                    const displayStatus = resolveDisplayOrderStatus(order.status, {
                                        isLate: order.is_late,
                                    });
                                    return (
                                        <tr
                                            key={order.id}
                                            className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-100"
                                        >
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="font-medium text-primary hover:underline font-mono text-sm"
                                                >
                                                    {formatOrderLabel(order)}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(name)}`}
                                                    >
                                                        {clientInitials(name)}
                                                    </div>
                                                    <span className="text-sm text-foreground">{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                                {order.created_at
                                                    ? format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr })
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-foreground">
                                                {order.items_count ?? order.items_summary ?? '—'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-foreground text-right font-medium whitespace-nowrap">
                                                {formatMoney(order.total_price)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <StatusLabel status={displayStatus} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        Affichage{' '}
                        <span className="font-medium text-foreground">
                            {rangeStart}–{rangeEnd}
                        </span>{' '}
                        sur <span className="font-medium text-foreground">{total}</span> commandes
                    </p>
                    {totalPages > 1 && (
                        <nav className="flex items-center gap-1" aria-label="Pagination">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
                                aria-label="Page précédente"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {pageNumbers.map((item, idx) =>
                                item === 'ellipsis' ? (
                                    <span key={`e-${idx}`} className="px-1 text-muted-foreground">
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setPage(item)}
                                        className={`h-8 w-8 inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                                            item === page
                                                ? 'bg-primary text-white'
                                                : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ),
                            )}
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
                                aria-label="Page suivante"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </nav>
                    )}
                </div>
            </div>
        </div>
    );
}
