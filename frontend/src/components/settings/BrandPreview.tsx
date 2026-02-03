import React from 'react';
import { Card } from '@/components/ui/Card';

export const BrandPreview = () => {
    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        APERÇU DU BRANDING
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                        LIVE
                    </span>
                </div>

                <Card className="overflow-hidden border-none shadow-lg" padding="none">
                    <div className="p-6 bg-white">
                        {/* Header with Logo and Invoice Info */}
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-32 h-10 bg-gray-100 rounded-md" /> {/* Logo placeholder */}
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">FACTURE</p>
                                <p className="text-sm font-bold text-gray-900">#INV-2024-001</p>
                            </div>
                        </div>

                        {/* Invoice Content Lines */}
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between">
                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                                <div className="h-3 bg-gray-100 rounded w-1/6" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-3 w-1/2 bg-gray-50 rounded" />
                                <div className="h-3 w-1/5 bg-gray-50 rounded" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-3 w-2/3 bg-gray-100 rounded" />
                                <div className="h-3 w-1/6 bg-gray-100 rounded" />
                            </div>
                        </div>

                        {/* Total Line */}
                        <div className="border-t border-gray-100 pt-4 flex flex-col items-end">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL À PAYER</p>
                            <p className="text-2xl font-bold text-primary">1,240.00 €</p>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="bg-secondary/30 p-4 text-center border-t border-blue-100">
                        <p className="text-[10px] text-primary italic font-medium">
                            Le logo sélectionné apparaîtra sur tous les documents officiels.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
