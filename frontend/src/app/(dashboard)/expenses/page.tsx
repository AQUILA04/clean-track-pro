'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    format,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Plus,
    Receipt,
    Trash2,
    Settings2,
    Upload,
    Download,
    Wallet,
    Package,
    Building2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import {
    ExpenseService,
    type ExpenseCategoryStat,
    type ExpenseData,
    type ExpenseListMeta,
    type ExpenseTypeData,
} from '@/services/expense.service';
import { SiteService, type Site } from '@/services/site.service';
import { StorageService } from '@/services/storage.service';
import { getSessionRoles, hasAnyRole, getSiteIdFromSession } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SiteKpiCard } from '@/components/dashboard/SiteKpiCard';
import { useToast } from '@/components/ui/simple-toast';
import { useTenantConfig } from '@/context/tenant-config.context';

type PeriodPreset = 'day' | 'week' | 'month' | 'custom';

const PAGE_SIZE = 20;

function periodRange(preset: PeriodPreset): { start: string; end: string } {
    const now = new Date();
    if (preset === 'day') {
        return {
            start: format(startOfDay(now), 'yyyy-MM-dd'),
            end: format(endOfDay(now), 'yyyy-MM-dd'),
        };
    }
    if (preset === 'week') {
        return {
            start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
            end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
    }
    return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
}

export default function ExpensesPage() {
    const { toast } = useToast();
    const { formatMoney, currencySymbol } = useTenantConfig();
    const formatCurrency = (value: number) => formatMoney(value);
    const { data: session } = useSession();
    const roles = getSessionRoles(session?.user);
    const isTenantAdmin = hasAnyRole(roles, ['Admin_Tenant', 'Superadmin', 'Super_Admin']);
    const canCreate = hasAnyRole(roles, ['User_Site', 'Admin_Site']);
    const canManageTypes = hasAnyRole(roles, ['Admin_Tenant', 'Admin_Site']);
    const canDelete = hasAnyRole(roles, ['Admin_Site', 'Admin_Tenant']);
    const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);

    const initialRange = periodRange('month');
    const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('month');
    const [startDate, setStartDate] = useState(initialRange.start);
    const [endDate, setEndDate] = useState(initialRange.end);
    const [filterSiteId, setFilterSiteId] = useState('');
    const [filterTypeId, setFilterTypeId] = useState('');
    const [page, setPage] = useState(1);
    const [sites, setSites] = useState<Site[]>([]);
    const [expenses, setExpenses] = useState<ExpenseData[]>([]);
    const [meta, setMeta] = useState<ExpenseListMeta>({
        total: 0,
        page: 1,
        limit: PAGE_SIZE,
        totalPages: 1,
    });
    const [types, setTypes] = useState<ExpenseTypeData[]>([]);
    const [total, setTotal] = useState(0);
    const [expenseCount, setExpenseCount] = useState(0);
    const [byCategory, setByCategory] = useState<ExpenseCategoryStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
    const formSectionRef = useRef<HTMLDivElement>(null);
    const descriptionInputRef = useRef<HTMLInputElement>(null);

    const [typeId, setTypeId] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const siteNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const site of sites) map.set(site.id, site.name);
        return map;
    }, [sites]);

    const tableColCount = (isTenantAdmin ? 1 : 0) + (canDelete ? 6 : 5);

    const topCategories = byCategory.slice(0, 2);

    const analysisInsight = useMemo(() => {
        if (total <= 0 || byCategory.length === 0) return null;
        const top = byCategory[0];
        const pct = Math.round((top.total / total) * 100);
        if (pct < 40) return null;
        return `${pct} % des dépenses de la période concernent « ${top.name} » (${formatCurrency(top.total)}).`;
    }, [byCategory, total]);

    useEffect(() => {
        if (!isTenantAdmin) return;
        SiteService.getAll()
            .then(setSites)
            .catch((err) => {
                console.error(err);
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger les agences.',
                    variant: 'destructive',
                });
            });
    }, [isTenantAdmin, toast]);

    const baseFilters = useMemo(
        () => ({
            startDate,
            endDate,
            ...(isTenantAdmin && filterSiteId ? { siteId: filterSiteId } : {}),
        }),
        [startDate, endDate, filterSiteId, isTenantAdmin],
    );

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const listFilters = {
                ...baseFilters,
                ...(filterTypeId ? { typeId: filterTypeId } : {}),
                page,
                limit: PAGE_SIZE,
            };
            const [listResult, stats, typeList] = await Promise.all([
                ExpenseService.list(listFilters),
                ExpenseService.getTotal(baseFilters),
                ExpenseService.listTypes(true),
            ]);
            setExpenses(listResult.data);
            setMeta(listResult.meta);
            setTotal(stats.total);
            setExpenseCount(stats.count);
            setByCategory(stats.byCategory);
            setTypes(typeList);
            setTypeId((prev) => prev || typeList[0]?.id || '');
        } catch (err) {
            console.error(err);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les dépenses.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [baseFilters, filterTypeId, page, toast]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const applyPreset = (preset: PeriodPreset) => {
        setPeriodPreset(preset);
        if (preset === 'custom') return;
        const range = periodRange(preset);
        setStartDate(range.start);
        setEndDate(range.end);
        setPage(1);
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
        setReceiptUrl(null);
        setShowForm(false);
    };

    const scrollToNewExpenseForm = useCallback(() => {
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
            descriptionInputRef.current?.focus({ preventScroll: true });
        }, 350);
    }, []);

    const handleAddExpenseClick = () => {
        if (showForm) {
            scrollToNewExpenseForm();
            return;
        }
        setShowForm(true);
    };

    useEffect(() => {
        if (!showForm) return;
        const t = window.setTimeout(scrollToNewExpenseForm, 50);
        return () => clearTimeout(t);
    }, [showForm, scrollToNewExpenseForm]);

    const handleUpload = async (file: File | null) => {
        if (!file) return;
        setUploading(true);
        try {
            const url = await StorageService.uploadFile(file);
            setReceiptUrl(url);
            toast({
                title: 'Justificatif ajouté',
                description: 'Le fichier a été téléversé.',
                variant: 'success',
            });
        } catch (err: unknown) {
            toast({
                title: 'Erreur upload',
                description: err instanceof Error ? err.message : 'Échec',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!typeId || !description.trim() || !amount) {
            toast({
                title: 'Champs requis',
                description: 'Type, description et montant sont obligatoires.',
                variant: 'destructive',
            });
            return;
        }
        if (!siteId && !hasAnyRole(roles, ['Admin_Tenant'])) {
            toast({
                title: 'Agence manquante',
                description: 'Aucune agence associée à votre compte.',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        try {
            await ExpenseService.create({
                expense_type_id: typeId,
                description: description.trim(),
                amount: parseFloat(amount),
                expense_date: expenseDate,
                receipt_url: receiptUrl || undefined,
            });
            toast({
                title: 'Dépense enregistrée',
                description: 'La dépense a été ajoutée.',
                variant: 'success',
            });
            resetForm();
            setPage(1);
            refresh();
        } catch (err: unknown) {
            toast({
                title: 'Erreur',
                description: err instanceof Error ? err.message : 'Échec',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingExpenseId) return;
        const id = deletingExpenseId;
        setDeletingExpenseId(null);
        try {
            await ExpenseService.remove(id);
            toast({
                title: 'Dépense supprimée',
                description: 'La dépense a été retirée.',
                variant: 'success',
            });
            refresh();
        } catch (err: unknown) {
            toast({
                title: 'Erreur',
                description: err instanceof Error ? err.message : 'Échec',
                variant: 'destructive',
            });
        }
    };

    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const all: ExpenseData[] = [];
            let currentPage = 1;
            let totalPages = 1;
            do {
                const result = await ExpenseService.list({
                    ...baseFilters,
                    ...(filterTypeId ? { typeId: filterTypeId } : {}),
                    page: currentPage,
                    limit: 100,
                });
                all.push(...result.data);
                totalPages = result.meta.totalPages;
                currentPage += 1;
            } while (currentPage <= totalPages);

            const header = [
                'Date',
                ...(isTenantAdmin ? ['Agence'] : []),
                'Description',
                'Catégorie',
                'Montant',
                'Justificatif',
            ];
            const rows = all.map((expense) => [
                expense.expense_date,
                ...(isTenantAdmin
                    ? [siteNameById.get(expense.site_id) || expense.site_id]
                    : []),
                `"${(expense.description || '').replace(/"/g, '""')}"`,
                expense.expense_type?.name || '',
                String(Number(expense.amount) || 0).replace('.', ','),
                expense.receipt_url || '',
            ]);
            const csv = [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `depenses_${startDate}_${endDate}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast({
                title: 'Export CSV',
                description: `${all.length} dépense${all.length > 1 ? 's' : ''} exportée${all.length > 1 ? 's' : ''}.`,
                variant: 'success',
            });
        } catch (err) {
            console.error(err);
            toast({
                title: 'Erreur',
                description: 'Impossible d’exporter les dépenses.',
                variant: 'destructive',
            });
        } finally {
            setExporting(false);
        }
    };

    const periodLabel =
        periodPreset === 'day'
            ? 'du jour'
            : periodPreset === 'week'
              ? 'de la semaine'
              : periodPreset === 'month'
                ? 'du mois'
                : 'de la période';

    const fromIndex = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    const toIndex = Math.min(meta.page * meta.limit, meta.total);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestion des Dépenses</h1>
                    <p className="text-sm text-muted-foreground">
                        Suivez et gérez les sorties d&apos;argent de votre agence.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {canManageTypes && (
                        <Link href="/expenses/types">
                            <Button variant="secondary" icon={<Settings2 className="h-4 w-4" />}>
                                Types de dépenses
                            </Button>
                        </Link>
                    )}
                    {canCreate && (
                        <Button
                            icon={<Plus className="h-4 w-4" />}
                            onClick={handleAddExpenseClick}
                        >
                            Ajouter une dépense
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SiteKpiCard
                    label={`Total dépenses (${periodLabel})`}
                    value={formatCurrency(total)}
                    icon={Wallet}
                    subValue={`${expenseCount} dépense${expenseCount > 1 ? 's' : ''}`}
                    trend="neutral"
                />
                <SiteKpiCard
                    label={topCategories[0]?.name || 'Catégorie #1'}
                    value={formatCurrency(topCategories[0]?.total ?? 0)}
                    icon={Building2}
                    subValue={
                        topCategories[0]
                            ? `${topCategories[0].count} ligne${topCategories[0].count > 1 ? 's' : ''}`
                            : 'Aucune dépense'
                    }
                    trend="neutral"
                />
                <SiteKpiCard
                    label={topCategories[1]?.name || 'Catégorie #2'}
                    value={formatCurrency(topCategories[1]?.total ?? 0)}
                    icon={Package}
                    subValue={
                        topCategories[1]
                            ? `${topCategories[1].count} ligne${topCategories[1].count > 1 ? 's' : ''}`
                            : 'Aucune dépense'
                    }
                    trend="neutral"
                />
            </div>

            <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-border">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                { id: 'day' as const, label: 'Jour' },
                                { id: 'week' as const, label: 'Semaine' },
                                { id: 'month' as const, label: 'Mois' },
                            ] as const
                        ).map((chip) => (
                            <button
                                key={chip.id}
                                type="button"
                                onClick={() => applyPreset(chip.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                                    periodPreset === chip.id
                                        ? 'bg-primary text-white'
                                        : 'bg-muted/40 border border-border text-muted-foreground hover:bg-muted/60'
                                }`}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="secondary"
                        icon={<Download className="h-4 w-4" />}
                        onClick={handleExportCsv}
                        isLoading={exporting}
                        disabled={meta.total === 0}
                    >
                        Exporter CSV
                    </Button>
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
                                setPage(1);
                            }}
                            className="block mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground"
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
                                setPage(1);
                            }}
                            className="block mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Catégorie</label>
                        <select
                            value={filterTypeId}
                            onChange={(e) => {
                                setFilterTypeId(e.target.value);
                                setPage(1);
                            }}
                            className="block mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground min-w-[180px]"
                        >
                            <option value="">Toutes les catégories</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {isTenantAdmin && (
                        <div>
                            <label className="text-xs text-muted-foreground">Agence</label>
                            <select
                                value={filterSiteId}
                                onChange={(e) => {
                                    setFilterSiteId(e.target.value);
                                    setPage(1);
                                }}
                                className="block mt-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground min-w-[200px]"
                            >
                                <option value="">Toutes les agences</option>
                                {sites.map((site) => (
                                    <option key={site.id} value={site.id}>
                                        {site.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {showForm && canCreate && (
                <div ref={formSectionRef} id="nouvelle-depense" tabIndex={-1} className="scroll-mt-6">
                <Card className="border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Nouvelle dépense</h3>
                    {types.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucun type actif.{' '}
                            {canManageTypes ? (
                                <Link href="/expenses/types" className="text-primary hover:underline">
                                    Configurer les types
                                </Link>
                            ) : (
                                'Contactez un manager pour en créer.'
                            )}
                        </p>
                    ) : (
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Catégorie
                                </label>
                                <select
                                    value={typeId}
                                    onChange={(e) => setTypeId(e.target.value)}
                                    className="w-full px-3 py-3 bg-card border border-border rounded-sm text-foreground"
                                    required
                                >
                                    {types.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Date"
                                type="date"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                required
                            />
                            <Input
                                ref={descriptionInputRef}
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex. Achat lessive"
                                required
                            />
                            <Input
                                label={`Montant (${currencySymbol})`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Justificatif (optionnel)
                                </label>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-muted/50 text-sm">
                                        <Upload className="h-4 w-4" />
                                        {uploading ? 'Téléversement...' : 'Choisir un fichier'}
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            disabled={uploading}
                                            onChange={(e) =>
                                                handleUpload(e.target.files?.[0] || null)
                                            }
                                        />
                                    </label>
                                    {receiptUrl && (
                                        <a
                                            href={receiptUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            Voir le justificatif
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="md:col-span-2 flex gap-2 justify-end">
                                <Button type="button" variant="ghost" onClick={resetForm}>
                                    Annuler
                                </Button>
                                <Button type="submit" isLoading={submitting}>
                                    Enregistrer
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
                </div>
            )}

            <Card className="border-border overflow-hidden" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-border text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                {isTenantAdmin && <th className="px-6 py-4">Agence</th>}
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Catégorie</th>
                                <th className="px-6 py-4">Montant</th>
                                <th className="px-6 py-4">Justificatif</th>
                                {canDelete && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={tableColCount}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        Chargement...
                                    </td>
                                </tr>
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={tableColCount}
                                        className="px-6 py-8 text-center text-muted-foreground"
                                    >
                                        Aucune dépense sur cette période.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr
                                        key={expense.id}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-foreground whitespace-nowrap">
                                            {format(new Date(expense.expense_date), 'd MMM yyyy', {
                                                locale: fr,
                                            })}
                                        </td>
                                        {isTenantAdmin && (
                                            <td className="px-6 py-4 text-foreground">
                                                {siteNameById.get(expense.site_id) || (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-foreground">
                                            {expense.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {expense.expense_type?.name || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-foreground">
                                            {formatCurrency(Number(expense.amount))}
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.receipt_url ? (
                                                <a
                                                    href={expense.receipt_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <Receipt className="h-4 w-4" />
                                                    Voir
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        {canDelete && (
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingExpenseId(expense.id)}
                                                    className="text-muted-foreground hover:text-red-400 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 flex items-center justify-between border-t border-border bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                        Affichage de{' '}
                        <span className="font-medium text-foreground">{fromIndex}</span> à{' '}
                        <span className="font-medium text-foreground">{toIndex}</span> sur{' '}
                        <span className="font-medium text-foreground">{meta.total}</span> dépenses
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={meta.page <= 1 || loading}
                            className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 disabled:opacity-50"
                        >
                            Précédent
                        </button>
                        <span className="text-sm text-muted-foreground tabular-nums">
                            {meta.page} / {meta.totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                            disabled={meta.page >= meta.totalPages || loading}
                            className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 disabled:opacity-50"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            </Card>

            {analysisInsight && (
                <div className="rounded-xl border border-border bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Analyse automatisée</p>
                        <p className="text-sm text-muted-foreground mt-1">{analysisInsight}</p>
                    </div>
                    {canManageTypes && (
                        <Link href="/expenses/types">
                            <Button variant="secondary">Voir les catégories</Button>
                        </Link>
                    )}
                </div>
            )}

            <ConfirmationModal
                isOpen={Boolean(deletingExpenseId)}
                onClose={() => setDeletingExpenseId(null)}
                onConfirm={handleDelete}
                title="Supprimer cette dépense ?"
                message="Cette action est irréversible. La dépense sera définitivement retirée."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
            />
        </div>
    );
}
