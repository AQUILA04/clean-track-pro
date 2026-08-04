'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PaymentMethod } from '@/services/payment.service';
import { CashRegisterService } from '@/services/cash-register.service';
import { AlertTriangle, Banknote, Smartphone, CreditCard, Building2 } from 'lucide-react';
import { useTenantConfig } from '@/context/tenant-config.context';

export type PaymentFormPhase = 'order_creation' | 'pickup';

interface PaymentFormProps {
    totalPrice: number;
    onConfirm: (amount: number, method: PaymentMethod, reference?: string) => void;
    onSkip: () => void;
    loading?: boolean;
    currency?: string;
    /** At pickup/delivery the full remaining balance must be paid. */
    phase?: PaymentFormPhase;
}

const PAYMENT_METHODS = [
    { value: PaymentMethod.CASH, label: 'Espèces', icon: Banknote },
    { value: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money', icon: Smartphone },
    { value: PaymentMethod.CARD, label: 'Carte', icon: CreditCard },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Virement', icon: Building2 },
] as const;

export const PaymentForm: React.FC<PaymentFormProps> = ({
    totalPrice,
    onConfirm,
    onSkip,
    loading = false,
    currency: currencyProp,
    phase = 'order_creation',
}) => {
    const { currency: tenantCurrency } = useTenantConfig();
    const currency = currencyProp ?? tenantCurrency;
    const requireFullPayment = phase === 'pickup';
    const [amount, setAmount] = useState<string>(totalPrice.toString());
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [reference, setReference] = useState('');
    const [hasOpenCashRegister, setHasOpenCashRegister] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        CashRegisterService.getCurrent()
            .then((session) => {
                if (!cancelled) setHasOpenCashRegister(session?.status === 'OPEN');
            })
            .catch(() => {
                if (!cancelled) setHasOpenCashRegister(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const numAmount = parseFloat(amount) || 0;
    const balanceAfter = totalPrice - numAmount;
    const isFullPayment = numAmount >= totalPrice - 0.01;
    const needsCashRegister = requireFullPayment || numAmount > 0;
    const cashRegisterBlocked = hasOpenCashRegister === false && needsCashRegister;
    const canSubmit = requireFullPayment
        ? isFullPayment && numAmount > 0 && !cashRegisterBlocked
        : numAmount >= 0 && !cashRegisterBlocked;

    const handlePayFull = () => {
        setAmount(totalPrice.toString());
    };

    const handleAmountChange = (value: string) => {
        if (requireFullPayment) {
            setAmount(totalPrice.toString());
            return;
        }
        setAmount(value);
    };

    const handleSubmit = () => {
        if (requireFullPayment) {
            if (!isFullPayment) return;
            onConfirm(totalPrice, method, reference || undefined);
            return;
        }
        if (numAmount <= 0) {
            onSkip();
            return;
        }
        onConfirm(Math.min(numAmount, totalPrice), method, reference || undefined);
    };

    return (
        <div className="bg-card rounded-xl border border-border p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Encaissement</h3>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {requireFullPayment ? 'Solde à régler' : 'Total'}
                    </p>
                    <p className="text-xl font-black text-foreground">
                        {totalPrice.toLocaleString()} {currency}
                    </p>
                </div>
            </div>

            {/* Payment method selector */}
            <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Mode de paiement
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon;
                        const selected = method === pm.value;
                        return (
                            <button
                                key={pm.value}
                                type="button"
                                onClick={() => setMethod(pm.value)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                                    selected
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {pm.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Amount input */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Montant encaissé
                    </label>
                    {!requireFullPayment && (
                        <button
                            type="button"
                            onClick={handlePayFull}
                            className="text-xs text-primary hover:underline font-medium"
                        >
                            Paiement total
                        </button>
                    )}
                </div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    min={requireFullPayment ? totalPrice : 0}
                    max={totalPrice}
                    step={100}
                    readOnly={requireFullPayment}
                    className={`w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-xl font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        requireFullPayment ? 'cursor-default opacity-90' : ''
                    }`}
                    disabled={loading}
                />
            </div>

            {/* Reference for non-cash */}
            {method !== PaymentMethod.CASH && (
                <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1 block">
                        Référence
                    </label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="N° transaction, réf. mobile money..."
                        className="w-full px-3 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={loading}
                    />
                </div>
            )}

            {/* Balance summary */}
            {requireFullPayment ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-sm text-emerald-400 font-medium">
                        Le solde doit être réglé intégralement avant la remise.
                    </p>
                </div>
            ) : (
                <>
                    {numAmount > 0 && !isFullPayment && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <p className="text-sm text-amber-400 font-medium">
                                Solde restant : {balanceAfter.toLocaleString()} {currency}
                            </p>
                            <p className="text-xs text-amber-400/70 mt-0.5">
                                Le client paiera le reste à la réception.
                            </p>
                        </div>
                    )}

                    {isFullPayment && numAmount > 0 && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <p className="text-sm text-emerald-400 font-medium">Paiement complet</p>
                        </div>
                    )}
                </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onSkip}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted/50 transition-colors duration-150 disabled:opacity-50"
                >
                    {requireFullPayment ? 'Annuler' : 'Sans paiement'}
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !canSubmit}
                    className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading && (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {requireFullPayment
                        ? `Encaisser ${totalPrice.toLocaleString()}`
                        : numAmount > 0
                          ? `Encaisser ${numAmount.toLocaleString()}`
                          : 'Confirmer'}
                </button>
            </div>

            {hasOpenCashRegister === false && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-400">
                        Aucune caisse ouverte. Vous devez{' '}
                        <Link
                            href="/cash-register"
                            className="font-medium underline underline-offset-2 hover:text-amber-300 transition-colors"
                        >
                            ouvrir votre caisse
                        </Link>{' '}
                        avant d&apos;encaisser un paiement.
                    </p>
                </div>
            )}
        </div>
    );
};
