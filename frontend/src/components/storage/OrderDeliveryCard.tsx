'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { formatOrderLabel } from '@/lib/order-display';
import { StatusLabel } from '@/components/shared/StatusLabel';
import { useFormatMoney } from '@/context/tenant-config.context';

interface OrderDeliveryCardProps {
    order: any;
    slotLabel: string | null;
    onDeliver: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export const OrderDeliveryCard: React.FC<OrderDeliveryCardProps> = ({
    order,
    slotLabel,
    onDeliver,
    onCancel,
    loading = false,
}) => {
    const formatMoney = useFormatMoney();
    const isExpress = order.service_level === 'EXPRESS';
    const clientName = order.client
        ? `${order.client.first_name || ''} ${order.client.last_name || ''}`.trim()
        : order.client_name?.trim() || 'Client inconnu';

    return (
        <div className="bg-card rounded-xl border border-border p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Vérification livraison</h2>
                    <p className="text-sm font-mono text-primary">{formatOrderLabel(order)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <StatusLabel status={order.status} />
                    {isExpress && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent">
                            <Zap className="h-3 w-3 mr-1 fill-current" />
                            Express
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div
                    className={`p-6 rounded-xl border-2 text-center ${
                        slotLabel
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-muted/30 border-border'
                    }`}
                >
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                        Emplacement
                    </p>
                    {slotLabel ? (
                        <p className="text-4xl font-black text-emerald-400">{slotLabel}</p>
                    ) : (
                        <p className="text-xl font-medium text-muted-foreground italic">
                            Non rangée
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Client
                        </p>
                        <p className="font-medium text-foreground">{clientName}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            Total
                        </p>
                        <p className="font-bold text-foreground">{formatMoney(order.total_price)}</p>
                    </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-xl border border-border max-h-40 overflow-y-auto">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Articles ({order.items?.length || 0})
                    </p>
                    <ul className="space-y-2">
                        {order.items?.map((item: any, idx: number) => {
                            const articleName =
                                item.article_label ||
                                item.article_name ||
                                item.label ||
                                'Article';
                            const serviceName = item.service_label || item.service_name || null;
                            return (
                                <li
                                    key={item.id || idx}
                                    className="text-sm text-foreground flex justify-between gap-3 border-b border-border/50 pb-1 last:border-0"
                                >
                                    <div className="min-w-0">
                                        <span className="font-medium">
                                            {item.quantity}× {articleName}
                                        </span>
                                        {serviceName && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {serviceName}
                                            </p>
                                        )}
                                    </div>
                                    {item.price != null && (
                                        <span className="shrink-0 text-muted-foreground">
                                            {formatMoney(item.price)}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted/50 transition-colors duration-150 disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={onDeliver}
                        disabled={loading || !slotLabel}
                        className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition-all duration-150 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        {slotLabel ? 'Confirmer la livraison' : 'Emplacement requis'}
                    </button>
                </div>
            </div>
        </div>
    );
};
