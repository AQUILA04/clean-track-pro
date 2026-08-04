'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CashRegisterService, type CashRegisterSessionData, type SessionSummary } from '@/services/cash-register.service';
import { RemittanceService } from '@/services/remittance.service';
import { UserService, type User } from '@/services/user.service';
import { useToast } from '@/components/ui/simple-toast';
import { useSession } from 'next-auth/react';
import { hasAnyRole, getSessionRoles, getSiteIdFromSession } from '@/lib/roles';
import { formatOperatorLabel, indexById } from '@/lib/entity-display';
import { Banknote, Smartphone, CreditCard, Building2, Clock, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

const METHOD_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
    CASH: { label: 'Especes', icon: Banknote },
    MOBILE_MONEY: { label: 'Mobile Money', icon: Smartphone },
    CARD: { label: 'Carte', icon: CreditCard },
    BANK_TRANSFER: { label: 'Virement', icon: Building2 },
};

export default function CashRegisterPage() {
    const { toast } = useToast();
    const { data: session } = useSession();
    const userRoles = getSessionRoles(session?.user);
    const isManager = hasAnyRole(userRoles, ['Admin_Site']);
    const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);

    const [currentSession, setCurrentSession] = useState<CashRegisterSessionData | null>(null);
    const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
    const [allSessions, setAllSessions] = useState<CashRegisterSessionData[]>([]);
    const [operatorsById, setOperatorsById] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [openingBalance, setOpeningBalance] = useState('0');
    const [declaredCash, setDeclaredCash] = useState('');
    const [closeNotes, setCloseNotes] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const current = await CashRegisterService.getCurrent();
            setCurrentSession(current);
            if (current?.id) {
                try {
                    const summary = await CashRegisterService.getSessionSummary(current.id);
                    setSessionSummary(summary);
                } catch (err) {
                    console.error(err);
                    setSessionSummary(null);
                }
            } else {
                setSessionSummary(null);
            }
        } catch (err) {
            console.error(err);
            setCurrentSession(null);
            setSessionSummary(null);
        }

        if (isManager) {
            try {
                const [sessions, users] = await Promise.all([
                    CashRegisterService.getSessions(),
                    siteId ? UserService.getUsers({ siteId }) : Promise.resolve([] as User[]),
                ]);
                setAllSessions(sessions);
                setOperatorsById(indexById(users));
            } catch (err) {
                console.error(err);
            }
        }

        setLoading(false);
    }, [isManager, siteId]);

    useEffect(() => { refresh(); }, [refresh]);

    const handleOpen = async () => {
        try {
            await CashRegisterService.open(parseFloat(openingBalance) || 0);
            toast({ title: 'Caisse ouverte', description: 'Votre session de caisse est active.', variant: 'success' });
            refresh();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        }
    };

    const handleClose = async () => {
        if (!declaredCash) {
            toast({ title: 'Erreur', description: 'Veuillez declarer le montant en caisse.', variant: 'destructive' });
            return;
        }
        try {
            const closed = await CashRegisterService.close(parseFloat(declaredCash), closeNotes || undefined);
            setCurrentSession(closed);
            toast({ title: 'Caisse cloturee', description: 'Session terminee avec succes.', variant: 'success' });
            setDeclaredCash('');
            setCloseNotes('');
            // Refresh summary / manager list without wiping the CLOSED session from state.
            if (closed.id) {
                try {
                    const summary = await CashRegisterService.getSessionSummary(closed.id);
                    setSessionSummary(summary);
                } catch (err) {
                    console.error(err);
                }
            }
            if (isManager) {
                try {
                    const sessions = await CashRegisterService.getSessions();
                    setAllSessions(sessions);
                } catch (err) {
                    console.error(err);
                }
            }
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
            await refresh();
        }
    };

    const handleRemit = async () => {
        if (!currentSession) return;
        try {
            const amount = Number(currentSession.declared_cash || currentSession.expected_cash || 0);
            const remittance = await RemittanceService.createCashRemittance(currentSession.id, amount);
            if (isManager || remittance.status === 'ACKNOWLEDGED') {
                toast({
                    title: 'Recette validee',
                    description: 'Votre recette est enregistree. Vous pouvez creer le versement periodique a l\'admin depuis Finance.',
                    variant: 'success',
                });
            } else {
                toast({ title: 'Versement cree', description: 'En attente de validation par le manager.', variant: 'success' });
            }
            await refresh();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl p-6">
                <h1 className="text-2xl font-bold mb-6 text-foreground">Ma Caisse</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl p-6">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Ma Caisse</h1>

            {/* No active session -> Open */}
            {!currentSession && (
                <div className="bg-card rounded-xl border border-border p-6 max-w-md">
                    <h2 className="text-lg font-bold text-foreground mb-4">Ouvrir la caisse</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                                Fond de caisse (optionnel)
                            </label>
                            <input
                                type="number"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                min={0}
                                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button
                            onClick={handleOpen}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all"
                        >
                            Ouvrir ma caisse
                        </button>
                    </div>
                </div>
            )}

            {/* Active session */}
            {currentSession && currentSession.status === 'OPEN' && (
                <div className="space-y-6">
                    {/* Session info */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                                <h2 className="text-lg font-bold text-foreground">Session en cours</h2>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {new Date(currentSession.opened_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {sessionSummary && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                                    <p className="text-xs text-muted-foreground uppercase">Encaissements</p>
                                    <p className="text-xl font-black text-foreground">{sessionSummary.summary.payment_count}</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg border border-border">
                                    <p className="text-xs text-muted-foreground uppercase">Total collecte</p>
                                    <p className="text-xl font-black text-foreground">
                                        {sessionSummary.summary.total_collected.toLocaleString()}
                                    </p>
                                </div>
                                {Object.entries(sessionSummary.summary.by_method).map(([method, total]) => {
                                    const meta = METHOD_LABELS[method] || { label: method, icon: Banknote };
                                    const Icon = meta.icon;
                                    return (
                                        <div key={method} className="p-3 bg-muted/30 rounded-lg border border-border">
                                            <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                                                <Icon className="h-3 w-3" /> {meta.label}
                                            </p>
                                            <p className="text-xl font-black text-foreground">{(total as number).toLocaleString()}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Recent payments */}
                        {sessionSummary && sessionSummary.payments.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Derniers encaissements</p>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {sessionSummary.payments.slice(-10).reverse().map((p: any) => (
                                        <div key={p.id} className="flex justify-between items-center text-sm p-2 bg-muted/20 rounded-lg border border-border/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                    {p.payment_method}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {new Date(p.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <span className="font-bold text-foreground">{Number(p.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Close session */}
                    <div className="bg-card rounded-xl border border-border p-6 max-w-md">
                        <h3 className="text-lg font-bold text-foreground mb-4">Cloturer la caisse</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                                    Montant cash declare
                                </label>
                                <input
                                    type="number"
                                    value={declaredCash}
                                    onChange={(e) => setDeclaredCash(e.target.value)}
                                    min={0}
                                    placeholder={`Attendu: ${Number(currentSession.expected_cash || 0).toLocaleString()}`}
                                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                                    Notes (optionnel)
                                </label>
                                <textarea
                                    value={closeNotes}
                                    onChange={(e) => setCloseNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                            >
                                Cloturer la caisse
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Closed session - show summary + remit button */}
            {currentSession && currentSession.status === 'CLOSED' && (
                <div className="space-y-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <h2 className="text-lg font-bold text-foreground">Session cloturee</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-muted/30 rounded-lg border border-border">
                                <p className="text-xs text-muted-foreground uppercase">Cash attendu</p>
                                <p className="text-xl font-black text-foreground">{Number(currentSession.expected_cash).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-muted/30 rounded-lg border border-border">
                                <p className="text-xs text-muted-foreground uppercase">Cash declare</p>
                                <p className="text-xl font-black text-foreground">{Number(currentSession.declared_cash || 0).toLocaleString()}</p>
                            </div>
                            <div className={`p-3 rounded-lg border ${
                                Number(currentSession.discrepancy || 0) === 0
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-amber-500/10 border-amber-500/30'
                            }`}>
                                <p className="text-xs text-muted-foreground uppercase">Ecart</p>
                                <p className={`text-xl font-black ${
                                    Number(currentSession.discrepancy || 0) === 0 ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                    {Number(currentSession.discrepancy || 0) > 0 ? '+' : ''}
                                    {Number(currentSession.discrepancy || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleRemit}
                            className="mt-6 w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {isManager ? 'Valider ma recette' : 'Verser la recette au manager'}
                        </button>
                        {isManager && (
                            <p className="mt-3 text-xs text-muted-foreground text-center">
                                En tant que Manager d&apos;agence, votre recette sera validée automatiquement puis disponible pour le versement au Manager général (page Finance).
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Manager view: all sessions */}
            {isManager && allSessions.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-foreground mb-4">Sessions de l&apos;agence</h2>
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left p-3 text-xs text-muted-foreground uppercase">Operateur</th>
                                    <th className="text-left p-3 text-xs text-muted-foreground uppercase">Ouverture</th>
                                    <th className="text-left p-3 text-xs text-muted-foreground uppercase">Statut</th>
                                    <th className="text-right p-3 text-xs text-muted-foreground uppercase">Cash attendu</th>
                                    <th className="text-right p-3 text-xs text-muted-foreground uppercase">Ecart</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allSessions.map((s) => (
                                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="p-3 text-foreground font-medium">
                                            {formatOperatorLabel(operatorsById[s.operator_id], s.operator_id)}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(s.opened_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                s.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400' :
                                                s.status === 'CLOSED' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right text-foreground font-medium">{Number(s.expected_cash).toLocaleString()}</td>
                                        <td className={`p-3 text-right font-medium ${
                                            Number(s.discrepancy || 0) === 0 ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>
                                            {s.discrepancy != null ? Number(s.discrepancy).toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
