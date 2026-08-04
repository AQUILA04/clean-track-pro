'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RemittanceService, type CashRemittanceData, type SiteRemittanceData } from '@/services/remittance.service';
import { UserService, type User } from '@/services/user.service';
import { SiteService, type Site } from '@/services/site.service';
import { useToast } from '@/components/ui/simple-toast';
import { useSession } from 'next-auth/react';
import { hasAnyRole, getSessionRoles, getSiteIdFromSession } from '@/lib/roles';
import { formatOperatorLabel, formatSiteLabel, indexById } from '@/lib/entity-display';
import { CheckCircle2, XCircle, Clock, Send, ArrowRight } from 'lucide-react';
import { useFormatMoney } from '@/context/tenant-config.context';

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-400',
    ACKNOWLEDGED: 'bg-emerald-500/10 text-emerald-400',
    DISPUTED: 'bg-red-500/10 text-red-400',
};

export default function FinancePage() {
    const { toast } = useToast();
    const { data: session } = useSession();
    const formatMoney = useFormatMoney();
    const userRoles = getSessionRoles(session?.user);
    const isManager = hasAnyRole(userRoles, ['Admin_Site']);
    const isTenantAdmin = hasAnyRole(userRoles, ['Admin_Tenant']);
    const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);

    const [cashRemittances, setCashRemittances] = useState<CashRemittanceData[]>([]);
    const [siteRemittances, setSiteRemittances] = useState<SiteRemittanceData[]>([]);
    const [operatorsById, setOperatorsById] = useState<Record<string, User>>({});
    const [sitesById, setSitesById] = useState<Record<string, Site>>({});
    const [loading, setLoading] = useState(true);

    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [siteRemittanceNotes, setSiteRemittanceNotes] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const lookups: Promise<unknown>[] = [];
            if (isManager && siteId) {
                lookups.push(
                    UserService.getUsers({ siteId }).then((users) => setOperatorsById(indexById(users))),
                );
            }
            if (isManager || isTenantAdmin) {
                lookups.push(
                    SiteService.getAll().then((sites) => setSitesById(indexById(sites))),
                );
            }
            await Promise.all(lookups);

            if (isManager || isTenantAdmin) {
                const cash = await RemittanceService.getCashRemittances(isManager ? siteId : undefined);
                setCashRemittances(cash);
            }
            if (isManager || isTenantAdmin) {
                const site = await RemittanceService.getSiteRemittances(isManager ? siteId : undefined);
                setSiteRemittances(site);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [isManager, isTenantAdmin, siteId]);

    useEffect(() => { refresh(); }, [refresh]);

    const handleAcknowledgeCash = async (id: string) => {
        try {
            await RemittanceService.acknowledgeCashRemittance(id);
            toast({ title: 'Versement confirmé', description: 'Le versement opérateur a été validé.', variant: 'success' });
            refresh();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        }
    };

    const handleDisputeCash = async (id: string) => {
        const notes = prompt('Raison du litige:');
        if (!notes) return;
        try {
            await RemittanceService.disputeCashRemittance(id, notes);
            toast({ title: 'Litige signalé', description: 'Le litige a été enregistré.', variant: 'default' });
            refresh();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        }
    };

    const handleCreateSiteRemittance = async () => {
        if (!periodStart || !periodEnd) {
            toast({ title: 'Erreur', description: 'Sélectionnez une période.', variant: 'destructive' });
            return;
        }
        try {
            await RemittanceService.createSiteRemittance(siteId, periodStart, periodEnd, siteRemittanceNotes || undefined);
            toast({
                title: 'Versement créé',
                description: 'En attente de validation par le Manager général.',
                variant: 'success',
            });
            setPeriodStart('');
            setPeriodEnd('');
            setSiteRemittanceNotes('');
            refresh();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        }
    };

    const handleAcknowledgeSite = async (id: string) => {
        try {
            await RemittanceService.acknowledgeSiteRemittance(id);
            toast({ title: 'Versement confirmé', description: 'Le versement agence a été validé.', variant: 'success' });
            refresh();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        }
    };

    const handleDisputeSite = async (id: string) => {
        const notes = prompt('Raison du litige:');
        if (!notes) return;
        try {
            await RemittanceService.disputeSiteRemittance(id, notes);
            toast({ title: 'Litige signalé', description: 'Le litige a été enregistré.', variant: 'default' });
            refresh();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-5xl p-6">
                <h1 className="text-2xl font-bold mb-6 text-foreground">Finance</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl p-6 space-y-8">
            <h1 className="text-2xl font-bold text-foreground">Finance</h1>

            {isManager && (
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-primary" />
                        Versements opérateurs
                    </h2>

                    {cashRemittances.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Aucun versement opérateur. Si vous avez opéré la caisse vous-même, validez d&apos;abord votre recette depuis Ma Caisse.
                        </p>
                    ) : (
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left p-3 text-xs text-muted-foreground uppercase">Date</th>
                                        <th className="text-left p-3 text-xs text-muted-foreground uppercase">Opérateur</th>
                                        <th className="text-right p-3 text-xs text-muted-foreground uppercase">Montant</th>
                                        <th className="text-center p-3 text-xs text-muted-foreground uppercase">Statut</th>
                                        <th className="text-right p-3 text-xs text-muted-foreground uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashRemittances.map((cr) => (
                                        <tr key={cr.id} className="border-b border-border/50 hover:bg-muted/20">
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(cr.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="p-3 text-foreground">
                                                {formatOperatorLabel(operatorsById[cr.operator_id], cr.operator_id)}
                                            </td>
                                            <td className="p-3 text-right font-bold text-foreground">{formatMoney(cr.amount)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[cr.status]}`}>
                                                    {cr.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                {cr.status === 'PENDING' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleAcknowledgeCash(cr.id)}
                                                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                            title="Confirmer"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDisputeCash(cr.id)}
                                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                            title="Litige"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            {isManager && (
                <section>
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />
                        Versement périodique au Manager général
                    </h2>
                    <div className="bg-card rounded-xl border border-border p-6 max-w-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Début</label>
                                <input
                                    type="date"
                                    value={periodStart}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Fin</label>
                                <input
                                    type="date"
                                    value={periodEnd}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">Notes (optionnel)</label>
                            <textarea
                                value={siteRemittanceNotes}
                                onChange={(e) => setSiteRemittanceNotes(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>
                        <button
                            onClick={handleCreateSiteRemittance}
                            disabled={!periodStart || !periodEnd}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            Créer le versement
                        </button>
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Historique des versements agence
                </h2>

                {siteRemittances.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Aucun versement périodique.</p>
                ) : (
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 text-xs text-muted-foreground uppercase">Période</th>
                                    <th className="text-left p-3 text-xs text-muted-foreground uppercase">Agence</th>
                                    <th className="text-right p-3 text-xs text-muted-foreground uppercase">Montant</th>
                                    <th className="text-center p-3 text-xs text-muted-foreground uppercase">Statut</th>
                                    {isTenantAdmin && (
                                        <th className="text-right p-3 text-xs text-muted-foreground uppercase">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {siteRemittances.map((sr) => (
                                    <tr key={sr.id} className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="p-3 text-foreground">
                                            {new Date(sr.period_start).toLocaleDateString('fr-FR')} - {new Date(sr.period_end).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="p-3 text-foreground">
                                            {formatSiteLabel(sitesById[sr.site_id], sr.site_id)}
                                        </td>
                                        <td className="p-3 text-right font-bold text-foreground">{formatMoney(sr.total_amount)}</td>
                                        <td className="p-3 text-center">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[sr.status]}`}>
                                                {sr.status}
                                            </span>
                                        </td>
                                        {isTenantAdmin && (
                                            <td className="p-3 text-right">
                                                {sr.status === 'PENDING' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleAcknowledgeSite(sr.id)}
                                                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                            title="Confirmer réception"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDisputeSite(sr.id)}
                                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                            title="Litige"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
