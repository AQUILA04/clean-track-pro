'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format-currency';
import { normalizeCurrencyCode } from '@/lib/currencies';

interface BrandPreviewProps {
    organizationName: string;
    logoUrl?: string | null;
    address?: string | null;
    legalId?: string | null;
    vatNumber?: string | null;
    /** Draft currency from the settings form — updates the preview before save. */
    currency: string;
}

export const BrandPreview: React.FC<BrandPreviewProps> = ({
    organizationName,
    logoUrl,
    address,
    legalId,
    vatNumber,
    currency,
}) => {
    const code = normalizeCurrencyCode(currency);
    const formatMoney = useMemo(
        () => (amount: number) => formatCurrency(amount, code),
        [code],
    );
    const initial = (organizationName || 'O').trim().charAt(0).toUpperCase() || 'O';

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Aperçu du branding
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        LIVE
                    </span>
                </div>

                <Card className="overflow-hidden shadow-lg" padding="none">
                    <div className="p-6 bg-white">
                        <div className="flex justify-between items-start mb-6 gap-4">
                            <div className="min-w-0">
                                {logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={logoUrl}
                                        alt={organizationName}
                                        className="h-10 max-w-[140px] object-contain object-left"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                                            <span className="text-white font-bold text-sm">{initial}</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {organizationName || 'Organisation'}
                                        </p>
                                    </div>
                                )}
                                {logoUrl && (
                                    <p className="text-xs font-semibold text-gray-800 mt-2 truncate">
                                        {organizationName}
                                    </p>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Reçu
                                </p>
                                <p className="text-sm font-bold text-gray-900">#CTP-DEMO</p>
                            </div>
                        </div>

                        {(address || legalId || vatNumber) && (
                            <div className="mb-6 space-y-0.5 text-[10px] text-gray-500 leading-relaxed">
                                {address && <p className="whitespace-pre-line">{address}</p>}
                                {legalId && <p>ID légal : {legalId}</p>}
                                {vatNumber && <p>TVA : {vatNumber}</p>}
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-xs text-gray-700">
                                <span>Nettoyage express × 2</span>
                                <span>{formatMoney(800)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-700">
                                <span>Repassage chemise × 3</span>
                                <span>{formatMoney(440)}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex flex-col items-end">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Total à payer
                            </p>
                            <p className="text-2xl font-bold text-blue-600">{formatMoney(1240)}</p>
                        </div>
                    </div>

                    <div className="bg-secondary/30 p-4 text-center border-t border-border">
                        <p className="text-[10px] text-primary italic font-medium">
                            Ce branding apparaît dans la navigation et sur les reçus imprimés.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
