'use client';

import React, { useEffect, useState } from 'react';
import { useOrderDraft } from '../../context/order-draft.context';
import { format } from 'date-fns';
import { Zap, MapPin, Store } from 'lucide-react';
import { PaymentForm } from '../payments/PaymentForm';
import { PaymentMethod } from '@/services/payment.service';
import { PaymentMethod as DtoPaymentMethod, DeliveryMode } from '@/types/create-order.dto';
import { pricingService } from '@/services/pricing.service';
import { ServicePrice } from '@/types/service-price';
import { LocalityService, Locality } from '@/services/locality.service';
import { useSession } from 'next-auth/react';
import { useFormatMoney } from '@/context/tenant-config.context';

interface OrderDraftSummaryProps {
    className?: string;
}

export const OrderDraftSummary: React.FC<OrderDraftSummaryProps> = ({ className }) => {
    const formatMoney = useFormatMoney();
    const {
        items,
        clientName,
        updateQuantity,
        updateService,
        clearDraft,
        isExpress,
        toggleExpress,
        totalPrice,
        estimatedDueDate,
        validateOrder,
        deliveryMode,
        setDeliveryMode,
        deliveryAddress,
        setDeliveryAddress,
        deliveryPhone,
        setDeliveryPhone,
        localityId,
        setLocalityId,
    } = useOrderDraft();

    const { data: session } = useSession();
    const siteId = (session?.user as any)?.site_ids?.[0] || (session?.user as any)?.site_id || '';

    const [showPayment, setShowPayment] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
    const [localities, setLocalities] = useState<Locality[]>([]);

    useEffect(() => {
        let cancelled = false;
        pricingService.findAll()
            .then((prices) => {
                if (!cancelled) setServicePrices(prices);
            })
            .catch((error) => {
                console.error('Failed to load service prices', error);
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!siteId) return;
        let cancelled = false;
        LocalityService.list(siteId, true)
            .then((rows) => {
                if (!cancelled) setLocalities(rows);
            })
            .catch(() => {
                if (!cancelled) setLocalities([]);
            });
        return () => { cancelled = true; };
    }, [siteId]);

    const getServicesForArticle = (articleId: string) =>
        servicePrices.filter((sp) => sp.article_type_id === articleId);

    const handleServiceChange = (index: number, serviceDefinitionId: string) => {
        const item = items[index];
        if (!item) return;

        const priceRow = servicePrices.find(
            (sp) =>
                sp.article_type_id === item.articleId &&
                sp.service_definition_id === serviceDefinitionId
        );
        if (!priceRow) return;

        updateService(
            index,
            priceRow.service_definition_id,
            priceRow.service_definition?.label || 'Service',
            Number(priceRow.price)
        );
    };

    const handleValidateClick = () => {
        if (items.length === 0 || !clientName) return;
        setShowPayment(true);
    };

    const handlePaymentConfirm = async (amount: number, method: PaymentMethod, reference?: string) => {
        setSubmitting(true);
        try {
            await validateOrder(amount, method as unknown as DtoPaymentMethod, reference);
            setShowPayment(false);
        } catch {
            // Toast already shown by validateOrder; keep payment form open
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentSkip = async () => {
        setSubmitting(true);
        try {
            await validateOrder();
            setShowPayment(false);
        } catch {
            // Toast already shown by validateOrder; keep payment form open
        } finally {
            setSubmitting(false);
        }
    };

    if (showPayment) {
        return (
            <div className={`bg-card h-full min-h-0 flex flex-col ${className}`}>
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="font-semibold text-lg text-foreground">Encaissement</h2>
                    <button
                        onClick={() => setShowPayment(false)}
                        className="text-xs text-muted-foreground hover:text-foreground underline transition-colors duration-150"
                    >
                        Retour au panier
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <PaymentForm
                        totalPrice={totalPrice}
                        onConfirm={handlePaymentConfirm}
                        onSkip={handlePaymentSkip}
                        loading={submitting}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-card h-full min-h-0 flex flex-col ${className} ${isExpress ? 'bg-accent/5' : ''}`}>
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
                <h2 className="font-semibold text-lg text-foreground">Current Order</h2>
                <div className="flex items-center space-x-3">
                    {items.length > 0 && (
                        <button
                            onClick={clearDraft}
                            className="text-xs text-red-400 hover:text-red-300 underline mr-2 transition-colors duration-150"
                        >
                            Clear
                        </button>
                    )}

                    <div
                        className={`flex items-center rounded-full p-1 cursor-pointer transition-colors duration-150 ${
                            isExpress ? 'bg-accent/20' : 'bg-muted'
                        }`}
                        onClick={toggleExpress}
                        title="Toggle Express Mode"
                    >
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 ${
                                !isExpress ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                            }`}
                        >
                            STD
                        </div>
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1 ${
                                isExpress ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'
                            }`}
                        >
                            {isExpress && <Zap className="h-3 w-3 fill-current" />}
                            EXP
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-4 border-b border-border shrink-0 ${isExpress ? 'bg-accent/10' : 'bg-muted/30'}`}>
                <span className="text-sm text-muted-foreground">Customer:</span>
                <div className="font-bold text-foreground truncate">
                    {clientName || <span className="text-muted-foreground italic">No client selected</span>}
                </div>
            </div>

            <div className="p-4 border-b border-border shrink-0 space-y-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Mode de livraison</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setDeliveryMode(DeliveryMode.PICKUP)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ${
                            deliveryMode === DeliveryMode.PICKUP
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                    >
                        <Store className="h-4 w-4" />
                        Retrait agence
                    </button>
                    <button
                        type="button"
                        onClick={() => setDeliveryMode(DeliveryMode.HOME_DELIVERY)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ${
                            deliveryMode === DeliveryMode.HOME_DELIVERY
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                    >
                        <MapPin className="h-4 w-4" />
                        A domicile
                    </button>
                </div>
                {deliveryMode === DeliveryMode.HOME_DELIVERY && (
                    <div className="space-y-2 pt-1">
                        <input
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Adresse de livraison"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <input
                            value={deliveryPhone}
                            onChange={(e) => setDeliveryPhone(e.target.value)}
                            placeholder="Telephone"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <select
                            value={localityId || ''}
                            onChange={(e) => setLocalityId(e.target.value || null)}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            <option value="">Localite...</option>
                            {localities.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4 space-y-3">
                {items.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-10">
                        <p>No items added.</p>
                        <p className="text-sm">Select a client and tap articles to add.</p>
                    </div>
                ) : (
                    items.map((item, index) => {
                        const availableServices = getServicesForArticle(item.articleId);
                        const hasMultipleServices = availableServices.length > 1;

                        return (
                            <div
                                key={`${item.articleId}-${item.serviceId}-${index}`}
                                className="flex justify-between items-start gap-2 bg-muted/30 p-3 rounded-xl border border-border"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground">{item.articleName}</div>
                                    {hasMultipleServices ? (
                                        <select
                                            value={item.serviceId}
                                            onChange={(e) => handleServiceChange(index, e.target.value)}
                                            className="mt-1.5 w-full max-w-full px-2 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                            aria-label={`Service pour ${item.articleName}`}
                                        >
                                            {availableServices.map((sp) => (
                                                <option key={sp.service_definition_id} value={sp.service_definition_id}>
                                                    {sp.service_definition?.label || 'Service'} — {formatMoney(sp.price)}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="text-xs text-muted-foreground mt-0.5">{item.serviceName}</div>
                                    )}
                                    <div className="text-sm font-semibold text-foreground mt-1">
                                        {formatMoney(item.price * item.quantity)}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                    <button
                                        onClick={() => updateQuantity(index, -1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:bg-muted/50 transition-colors duration-150"
                                    >
                                        -
                                    </button>
                                    <span className="w-6 text-center font-medium text-foreground">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(index, 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-card border border-border text-emerald-400 hover:bg-emerald-500/10 transition-colors duration-150"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-border bg-card space-y-3 shrink-0">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Items</span>
                    <span className="font-bold text-foreground">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                </div>

                {estimatedDueDate && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Due Date</span>
                        <span className={`font-medium ${isExpress ? 'text-accent' : 'text-foreground'}`}>
                            {format(estimatedDueDate, 'MMM d, HH:mm')}
                        </span>
                    </div>
                )}

                <div className="flex justify-between items-center text-xl font-bold text-foreground">
                    <span>
                        Total {isExpress && <span className="text-sm text-accent font-normal">(Express)</span>}
                    </span>
                    <span className={isExpress ? 'text-accent' : ''}>{formatMoney(totalPrice)}</span>
                </div>

                <button
                    onClick={handleValidateClick}
                    disabled={items.length === 0 || !clientName}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                >
                    Valider & Encaisser
                </button>
            </div>
        </div>
    );
};
