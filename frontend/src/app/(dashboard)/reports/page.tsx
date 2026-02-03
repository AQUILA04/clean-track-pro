import React from 'react';
import { Card } from '@/components/ui/Card';

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <h3 className="font-semibold text-lg">Ventes Mensuelles</h3>
                    <div className="h-40 bg-gray-100 mt-4 rounded flex items-center justify-center text-sm text-gray-400">
                        Graphique
                    </div>
                </Card>
                <Card>
                    <h3 className="font-semibold text-lg">Performance Agences</h3>
                    <div className="h-40 bg-gray-100 mt-4 rounded flex items-center justify-center text-sm text-gray-400">
                        Graphique
                    </div>
                </Card>
            </div>
        </div>
    );
}
