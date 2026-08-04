'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SignupService, type PublicPlan, type SubmitSignupDto } from '@/services/signup.service';
import { POPULAR_CURRENCIES } from '@/lib/currencies';
import { formatCurrency } from '@/lib/format-currency';
import {
    convertAmountSync,
    fetchRatesPerEur,
    suggestDisplayCurrency,
} from '@/lib/fx';

type Step = 'info' | 'plan' | 'done';
type BillingCycle = 'MONTHLY' | 'YEARLY';
const YEARLY_DISCOUNT_RATE = 0.17;

const LIMIT_LABELS: Record<string, string> = {
    'orders.create': 'commandes',
    'sites.capacity': 'agences',
    'users.capacity': 'utilisateurs',
    'storage_slots.capacity': 'emplacements',
};

function ErrorBanner({ message }: { message: string }) {
    return (
        <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm"
        >
            {message}
        </div>
    );
}

function planBillingCurrency(plan: PublicPlan): string {
    return (plan.currency || 'EUR').toUpperCase();
}

export default function SignupPage() {
    const [step, setStep] = useState<Step>('info');
    const [plans, setPlans] = useState<PublicPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
    const [displayCurrency, setDisplayCurrency] = useState('XOF');
    const [rates, setRates] = useState<Record<string, number> | null>(null);
    const [geoSource, setGeoSource] = useState<string>('default');
    const errorRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState<SubmitSignupDto>({
        organization_name: '',
        agency_name: '',
        admin_email: '',
        admin_first_name: '',
        admin_last_name: '',
        plan_id: '',
    });

    useEffect(() => {
        SignupService.listPublicPlans()
            .then(setPlans)
            .catch(() => setError('Impossible de charger les offres'));

        Promise.all([fetchRatesPerEur(), suggestDisplayCurrency()])
            .then(([fxRates, suggest]) => {
                setRates(fxRates);
                setDisplayCurrency(suggest.currency);
                setGeoSource(suggest.source);
            })
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        if (error) {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error]);

    const selectedPlan = plans.find((p) => p.id === form.plan_id);
    const publicInputClass = 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
    const publicLabelClass = 'text-gray-700';

    const formatDisplayAmount = (amount: number, fromCurrency: string) => {
        const converted = convertAmountSync(amount, fromCurrency, displayCurrency, rates ?? undefined);
        return formatCurrency(converted, displayCurrency);
    };

    const getEffectivePrice = (plan: PublicPlan) => {
        const monthlyPrice = Number(plan.price);
        if (billingCycle === 'YEARLY') {
            return monthlyPrice * 12 * (1 - YEARLY_DISCOUNT_RATE);
        }
        return monthlyPrice;
    };

    const getPlanPriceLabel = (plan: PublicPlan) => {
        const monthlyPrice = Number(plan.price);
        if (plan.is_free || monthlyPrice <= 0) {
            return 'Gratuit';
        }
        const billing = planBillingCurrency(plan);
        const amount = getEffectivePrice(plan);
        const suffix = billingCycle === 'YEARLY' ? '/an' : '/mois';
        const display = formatDisplayAmount(amount, billing);
        if (billing === displayCurrency) {
            return `${display}${suffix}`;
        }
        return `${display}${suffix}`;
    };

    const getPlanSecondaryPrice = (plan: PublicPlan) => {
        const monthlyPrice = Number(plan.price);
        if (plan.is_free || monthlyPrice <= 0) {
            return null;
        }
        const billing = planBillingCurrency(plan);
        const billedLabel = formatCurrency(
            billingCycle === 'YEARLY' ? monthlyPrice * 12 * (1 - YEARLY_DISCOUNT_RATE) : monthlyPrice,
            billing,
        );
        const period = billingCycle === 'YEARLY' ? '/an' : '/mois';

        if (billing === displayCurrency) {
            if (billingCycle === 'YEARLY') {
                const monthlyEquivalent = (monthlyPrice * 12 * (1 - YEARLY_DISCOUNT_RATE)) / 12;
                return `${formatDisplayAmount(monthlyEquivalent, billing)} /mois équivalent`;
            }
            const yearlyDiscounted = monthlyPrice * 12 * (1 - YEARLY_DISCOUNT_RATE);
            return `${formatDisplayAmount(yearlyDiscounted, billing)} /an si paiement annuel (-17%)`;
        }

        return `Facturation : ${billedLabel}${period} · montant indicatif`;
    };

    const getCommercialBadge = (plan: PublicPlan): string | null => {
        if (plan.is_free) {
            return 'Commencez gratuitement';
        }
        if (billingCycle === 'YEARLY') {
            return '17% d\'économie annuelle';
        }
        return 'Sans engagement annuel';
    };

    const extractPlanLimits = (plan: PublicPlan): string[] => {
        const limits = (plan.limits ?? {}) as Record<string, { windows?: Array<{ period: string; limit: number | null }> }>;
        const summary: string[] = [];

        for (const [operationKey, config] of Object.entries(limits)) {
            const label = LIMIT_LABELS[operationKey];
            if (!label || !config?.windows?.length) continue;

            const prioritizedPeriods = ['monthly', 'weekly', 'daily', 'none'];
            const targetWindow = prioritizedPeriods
                .map((period) => config.windows?.find((window) => window.period === period))
                .find(Boolean);

            if (!targetWindow) continue;

            if (targetWindow.limit === null || targetWindow.limit === undefined || Number(targetWindow.limit) < 0) {
                summary.push(`${label} illimités`);
                continue;
            }

            const unitMap: Record<string, string> = {
                monthly: '/mois',
                weekly: '/semaine',
                daily: '/jour',
                none: '',
            };
            summary.push(`${targetWindow.limit} ${label}${unitMap[targetWindow.period] ?? ''}`);
        }

        return summary.slice(0, 3);
    };

    const handleInfoNext = () => {
        if (!form.organization_name || !form.agency_name || !form.admin_email || !form.admin_first_name || !form.admin_last_name) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }
        setError(null);
        setStep('plan');
    };

    const handleSubmit = async () => {
        if (!form.plan_id) {
            setError('Sélectionnez un plan');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const payload: SubmitSignupDto = {
                ...form,
                billing_cycle: billingCycle,
            };
            const result = await SignupService.submit(payload);
            if (result.requiresPayment && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
                return;
            }
            setSuccessMessage(result.message);
            setStep('done');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F0F5FF] to-white text-gray-900">
            <div className="mx-auto max-w-3xl px-4 py-10">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#1A5AD7] hover:underline mb-8">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à l&apos;accueil
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Créer votre compte CleanTrack Pro</h1>
                    <p className="mt-2 text-gray-600">
                        Configurez votre pressing en quelques minutes. Choisissez l&apos;offre adaptée à votre activité.
                    </p>
                </div>

                {error && (
                    <div ref={errorRef}>
                        <ErrorBanner message={error} />
                    </div>
                )}

                {step === 'info' && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-[#1A5AD7]" />
                            Votre organisation
                        </h2>
                        <Input
                            label="Nom de l'organisation"
                            labelClassName={publicLabelClass}
                            value={form.organization_name}
                            onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                            placeholder="Ex. Pressing Réunion"
                            className={publicInputClass}
                        />
                        <Input
                            label="Nom de l'agence principale"
                            labelClassName={publicLabelClass}
                            value={form.agency_name}
                            onChange={(e) => setForm({ ...form, agency_name: e.target.value })}
                            placeholder="Ex. Agence Centre-Ville"
                            className={publicInputClass}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Prénom de l'administrateur"
                                labelClassName={publicLabelClass}
                                value={form.admin_first_name}
                                onChange={(e) => setForm({ ...form, admin_first_name: e.target.value })}
                                className={publicInputClass}
                            />
                            <Input
                                label="Nom de l'administrateur"
                                labelClassName={publicLabelClass}
                                value={form.admin_last_name}
                                onChange={(e) => setForm({ ...form, admin_last_name: e.target.value })}
                                className={publicInputClass}
                            />
                        </div>
                        <Input
                            label="Email administrateur"
                            labelClassName={publicLabelClass}
                            type="email"
                            value={form.admin_email}
                            onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                            placeholder="admin@pressing.fr"
                            className={publicInputClass}
                        />
                        <Button onClick={handleInfoNext} className="w-full md:w-auto">
                            Continuer — choisir un plan
                        </Button>
                    </div>
                )}

                {step === 'plan' && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Choisissez votre plan</h2>
                                <div className="w-full sm:w-64">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Afficher les prix en
                                    </label>
                                    <select
                                        value={displayCurrency}
                                        onChange={(e) => {
                                            setDisplayCurrency(e.target.value);
                                            setGeoSource('manual');
                                        }}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                                    >
                                        {POPULAR_CURRENCIES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        {geoSource === 'geo'
                                            ? 'Devise détectée selon votre localisation'
                                            : geoSource === 'timezone'
                                              ? 'Devise estimée selon votre fuseau horaire'
                                              : geoSource === 'manual'
                                                ? 'Sélection manuelle'
                                                : 'Devise par défaut'}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('MONTHLY')}
                                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                        billingCycle === 'MONTHLY'
                                            ? 'bg-white text-gray-900 shadow'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Mensuel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('YEARLY')}
                                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                                        billingCycle === 'YEARLY'
                                            ? 'bg-white text-gray-900 shadow'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Annuel (-17%)
                                </button>
                            </div>
                            <p className="mb-5 text-sm text-gray-600">
                                Payez à l&apos;année et économisez <span className="font-semibold text-emerald-700">17%</span> sur le total.
                                Les montants convertis sont indicatifs ; le paiement Stripe est en EUR ou USD selon le plan.
                            </p>
                            <div className="grid gap-4 md:grid-cols-2">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => setForm({ ...form, plan_id: plan.id, billing_cycle: billingCycle })}
                                        className={`rounded-xl border-2 p-5 text-left transition-all text-gray-900 ${
                                            form.plan_id === plan.id
                                                ? 'border-[#1A5AD7] bg-[#F0F5FF] shadow-md'
                                                : 'border-gray-200 bg-white hover:border-[#1A5AD7]/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="font-semibold text-lg text-gray-900">{plan.name}</span>
                                            {plan.is_free ? (
                                                <span className="text-sm font-medium text-emerald-600">Gratuit</span>
                                            ) : (
                                                <span className="text-sm font-medium text-[#1A5AD7]">
                                                    {getPlanPriceLabel(plan)}
                                                </span>
                                            )}
                                        </div>
                                        {getCommercialBadge(plan) && (
                                            <p className="mt-1 text-xs font-medium text-gray-700">
                                                {getCommercialBadge(plan)}
                                            </p>
                                        )}
                                        {getPlanSecondaryPrice(plan) && (
                                            <p className="mt-1 text-xs text-gray-500">{getPlanSecondaryPrice(plan)}</p>
                                        )}
                                        <ul className="mt-2 space-y-1">
                                            {extractPlanLimits(plan).map((line) => (
                                                <li key={`${plan.id}-${line}`} className="text-sm text-gray-600">• {line}</li>
                                            ))}
                                        </ul>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedPlan && !selectedPlan.is_free && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    Vous serez redirigé vers Stripe pour finaliser le paiement
                                    ({planBillingCurrency(selectedPlan)}) avant activation du compte.
                                </p>
                            </div>
                        )}

                        {error && <ErrorBanner message={error} />}

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setStep('info')}
                                className="!bg-white !border-gray-200 !text-gray-700 hover:!bg-gray-50"
                            >
                                Retour
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading
                                    ? 'Traitement...'
                                    : selectedPlan?.is_free
                                      ? 'Créer mon compte gratuitement'
                                      : 'Continuer vers le paiement sécurisé'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'done' && (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900">Demande enregistrée</h2>
                        <p className="mt-2 text-gray-600">{successMessage}</p>
                        <Link href="/auth/signin" className="mt-6 inline-block text-[#1A5AD7] hover:underline">
                            Aller à la connexion
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
