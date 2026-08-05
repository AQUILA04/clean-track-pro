'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Power } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ExpenseService, type ExpenseTypeData } from '@/services/expense.service';
import { getSessionRoles, hasAnyRole } from '@/lib/roles';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/simple-toast';
import { PageLoader, TableLoadingRow } from '@/components/ui/loading';

export default function ExpenseTypesPage() {
    const { toast } = useToast();
    const { data: session, status } = useSession();
    const roles = getSessionRoles(session?.user);
    const canManage = hasAnyRole(roles, ['Admin_Tenant', 'Admin_Site']);

    const [types, setTypes] = useState<ExpenseTypeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const list = await ExpenseService.listTypes(false);
            setTypes(list);
        } catch (err) {
            console.error(err);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les types.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (status === 'authenticated' && canManage) {
            refresh();
        }
    }, [status, canManage, refresh]);

    if (status === 'loading') {
        return <PageLoader />;
    }

    if (!canManage) {
        return (
            <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
                <p className="text-muted-foreground">
                    Seuls les administrateurs peuvent configurer les types de dépenses.
                </p>
                <Link href="/expenses" className="text-primary hover:underline text-sm">
                    Retour aux dépenses
                </Link>
            </div>
        );
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSubmitting(true);
        try {
            await ExpenseService.createType(name.trim(), description.trim() || undefined);
            toast({ title: 'Type créé', description: 'Le type de dépense est disponible.', variant: 'success' });
            setName('');
            setDescription('');
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

    const toggleActive = async (type: ExpenseTypeData) => {
        try {
            if (type.is_active) {
                await ExpenseService.deactivateType(type.id);
                toast({
                    title: 'Type désactivé',
                    description: 'Il ne sera plus proposé à la saisie.',
                    variant: 'default',
                });
            } else {
                await ExpenseService.updateType(type.id, { is_active: true });
                toast({
                    title: 'Type réactivé',
                    description: 'Il est de nouveau sélectionnable.',
                    variant: 'success',
                });
            }
            refresh();
        } catch (err: unknown) {
            toast({
                title: 'Erreur',
                description: err instanceof Error ? err.message : 'Échec',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link
                        href="/expenses"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour aux dépenses
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">Types de dépenses</h1>
                    <p className="text-sm text-muted-foreground">
                        Quatre catégories système (Loyer, Fournitures, Salaires, Autres) sont
                        fournies par défaut. Vous pouvez en ajouter d&apos;autres.
                    </p>
                </div>
            </div>

            <Card className="border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Nouveau type</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Nom"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex. Fournitures"
                        required
                    />
                    <Input
                        label="Description (optionnel)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Précisions"
                    />
                    <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" isLoading={submitting} icon={<Plus className="h-4 w-4" />}>
                            Ajouter
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="border-border overflow-hidden" padding="none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-border text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Nom</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableLoadingRow colSpan={4} label="Chargement des types…" />
                            ) : types.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        Aucun type configuré.
                                    </td>
                                </tr>
                            ) : (
                                types.map((type) => (
                                    <tr
                                        key={type.id}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-semibold text-foreground">
                                            {type.name}
                                            {type.is_system && (
                                                <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                                                    Système
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {type.description || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    type.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-slate-500/10 text-slate-400'
                                                }`}
                                            >
                                                {type.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(type)}
                                                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                                                title={type.is_active ? 'Désactiver' : 'Réactiver'}
                                            >
                                                <Power className="h-4 w-4" />
                                                {type.is_active ? 'Désactiver' : 'Réactiver'}
                                            </button>
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
