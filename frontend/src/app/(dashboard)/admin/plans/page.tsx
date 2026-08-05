'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Plus, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import {
    SubscriptionService,
    mergePlanUpdate,
    type SubscriptionPlan,
    type UpdateSubscriptionPlanDto,
} from '@/services/subscription.service';
import { useToast } from '@/components/ui/simple-toast';
import { ContentLoader } from '@/components/ui/loading';
import { PlanLimitsEditor } from '@/components/subscription/PlanLimitsEditor';
import { parsePlanLimits, serializePlanLimits } from '@/lib/plan-limits';

function PlanIdentityFields({
    plan,
    disabled,
    onSave,
}: {
    plan: SubscriptionPlan;
    disabled: boolean;
    onSave: (patch: { name: string; price: number; currency: 'EUR' | 'USD' }) => Promise<void>;
}) {
    const [name, setName] = useState(plan.name);
    const [price, setPrice] = useState(String(plan.price));
    const [currency, setCurrency] = useState<'EUR' | 'USD'>(
        plan.currency === 'USD' ? 'USD' : 'EUR',
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(plan.name);
        setPrice(String(plan.price));
        setCurrency(plan.currency === 'USD' ? 'USD' : 'EUR');
    }, [plan.id, plan.name, plan.price, plan.currency]);

    const priceNumber = Number(price);
    const dirty =
        name.trim() !== plan.name ||
        (!Number.isNaN(priceNumber) && priceNumber !== Number(plan.price)) ||
        currency !== (plan.currency === 'USD' ? 'USD' : 'EUR');

    const handleSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (Number.isNaN(priceNumber) || priceNumber < 0) return;

        setSaving(true);
        try {
            await onSave({ name: trimmed, price: priceNumber, currency });
        } finally {
            setSaving(false);
        }
    };

    const currencySymbol = currency === 'USD' ? '$' : '€';

    return (
        <div className="space-y-3 max-w-lg">
            <div className="flex items-center gap-3 flex-wrap">
                {plan.is_free && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                        Free tier
                    </span>
                )}
                {!plan.is_active && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                        Désactivé
                    </span>
                )}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_100px_auto] sm:items-end">
                <Input
                    label="Libellé"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={disabled || saving}
                    placeholder="Nom du plan"
                />
                <Input
                    label={plan.billing_interval === 'YEARLY' ? `Montant / an` : `Montant / mois`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={disabled || saving}
                />
                <div className="w-full">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Devise</label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'EUR' | 'USD')}
                        disabled={disabled || saving}
                        className="w-full pl-3 pr-3 py-3 bg-card border border-border rounded-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </div>
                <Button
                    variant="secondary"
                    onClick={handleSave}
                    disabled={disabled || saving || !dirty || !name.trim() || Number.isNaN(priceNumber) || priceNumber < 0}
                    isLoading={saving}
                    className="sm:mb-0.5"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                {plan.is_free
                    ? `Plan gratuit — le montant reste affiché pour référence (0 ${currencySymbol} recommandé).`
                    : `Facturation Stripe en ${currency} · ${plan.billing_interval === 'YEARLY' ? 'annuelle' : 'mensuelle'}`}
            </p>
        </div>
    );
}

export default function AdminPlansPage() {
    const { showToast } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanPrice, setNewPlanPrice] = useState('0');
    const [newPlanCurrency, setNewPlanCurrency] = useState<'EUR' | 'USD'>('EUR');
    const [newPlanInterval, setNewPlanInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [newPlanIsFree, setNewPlanIsFree] = useState(false);
    const [newPlanPublic, setNewPlanPublic] = useState(true);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await SubscriptionService.listPlans();
            setPlans(data);
        } catch {
            showToast('Impossible de charger les plans', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updatePlan = async (id: string, patch: UpdateSubscriptionPlanDto) => {
        setSavingId(id);
        try {
            const updated = await SubscriptionService.updatePlan(id, patch);
            setPlans((prev) =>
                prev.map((p) => (p.id === id ? mergePlanUpdate(p, updated, patch) : p)),
            );
            showToast('Plan mis à jour', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Échec de la mise à jour';
            showToast(message, 'error');
        } finally {
            setSavingId(null);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanName.trim()) {
            showToast('Le nom du plan est requis', 'error');
            return;
        }

        const price = Number(newPlanPrice);
        if (Number.isNaN(price) || price < 0) {
            showToast('Le prix du plan est invalide', 'error');
            return;
        }

        setCreating(true);
        try {
            const defaultLimits = serializePlanLimits(parsePlanLimits(undefined));
            const created = await SubscriptionService.createPlan({
                name: newPlanName.trim(),
                price,
                currency: newPlanCurrency,
                billing_interval: newPlanInterval,
                is_public: newPlanPublic,
                is_active: true,
                is_free: newPlanIsFree,
                auto_approve_signups: false,
                limits: defaultLimits,
                features: {},
            });
            setPlans((prev) => [...prev, created]);
            setNewPlanName('');
            setNewPlanPrice('0');
            setNewPlanCurrency('EUR');
            setNewPlanInterval('MONTHLY');
            setNewPlanIsFree(false);
            setNewPlanPublic(true);
            showToast('Plan créé avec succès', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Impossible de créer le plan';
            showToast(message, 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                        Plans d&apos;abonnement
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Modifiez les libellés et tarifs, activez les offres et configurez les quotas.
                    </p>
                </div>
                <Button variant="secondary" onClick={fetchPlans} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                </Button>
            </div>

            <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Créer un nouveau plan
                </h2>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Le plan est créé avec des limites par défaut que vous pouvez ensuite éditer.
                </p>
                <div className="grid gap-3 md:grid-cols-6">
                    <Input
                        label="Nom"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder="Ex: Business"
                    />
                    <Input
                        label="Prix"
                        type="number"
                        min={0}
                        step="0.01"
                        value={newPlanPrice}
                        onChange={(e) => setNewPlanPrice(e.target.value)}
                    />
                    <div className="w-full">
                        <label className="block text-sm font-medium text-foreground mb-1.5">Devise</label>
                        <select
                            value={newPlanCurrency}
                            onChange={(e) => setNewPlanCurrency(e.target.value as 'EUR' | 'USD')}
                            className="w-full pl-4 pr-4 py-3 bg-card border border-border rounded-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        >
                            <option value="EUR">EUR (€)</option>
                            <option value="USD">USD ($)</option>
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="block text-sm font-medium text-foreground mb-1.5">Facturation</label>
                        <select
                            value={newPlanInterval}
                            onChange={(e) => setNewPlanInterval(e.target.value as 'MONTHLY' | 'YEARLY')}
                            className="w-full pl-4 pr-4 py-3 bg-card border border-border rounded-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                        >
                            <option value="MONTHLY">Mensuelle</option>
                            <option value="YEARLY">Annuelle</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between rounded-sm border border-border px-3 py-3">
                        <span className="text-sm">Plan gratuit</span>
                        <Switch checked={newPlanIsFree} onCheckedChange={setNewPlanIsFree} disabled={creating} />
                    </div>
                    <div className="flex items-center justify-between rounded-sm border border-border px-3 py-3">
                        <span className="text-sm">Visible publiquement</span>
                        <Switch checked={newPlanPublic} onCheckedChange={setNewPlanPublic} disabled={creating} />
                    </div>
                </div>
                <Button className="mt-4" onClick={handleCreatePlan} disabled={creating} isLoading={creating}>
                    Créer le plan
                </Button>
            </Card>

            {loading ? (
                <ContentLoader label="Chargement des plans…" />
            ) : (
                <div className="grid gap-4">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <PlanIdentityFields
                                    plan={plan}
                                    disabled={savingId === plan.id}
                                    onSave={async ({ name, price, currency }) => {
                                        await updatePlan(plan.id, { name, price, currency });
                                    }}
                                />

                                <div className="space-y-4 md:min-w-[280px]">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm">Plan actif (inscription)</span>
                                        <Switch
                                            checked={plan.is_active}
                                            disabled={savingId === plan.id}
                                            onCheckedChange={(checked) => updatePlan(plan.id, { is_active: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm">Visible publiquement</span>
                                        <Switch
                                            checked={plan.is_public}
                                            disabled={savingId === plan.id}
                                            onCheckedChange={(checked) => updatePlan(plan.id, { is_public: checked })}
                                        />
                                    </div>
                                    {plan.is_free && (
                                        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/50 p-3">
                                            <div>
                                                <span className="text-sm font-medium">Validation automatique</span>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Sinon : demande en attente pour approbation manuelle
                                                </p>
                                            </div>
                                            <Switch
                                                checked={plan.auto_approve_signups}
                                                disabled={savingId === plan.id}
                                                onCheckedChange={(checked) =>
                                                    updatePlan(plan.id, { auto_approve_signups: checked })
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <PlanLimitsEditor
                                limits={plan.limits}
                                disabled={savingId === plan.id}
                                onSave={async (limits) => {
                                    await updatePlan(plan.id, { limits });
                                }}
                            />
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
