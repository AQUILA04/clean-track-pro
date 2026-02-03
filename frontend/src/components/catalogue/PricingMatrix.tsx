import React from 'react';
import { Button } from '@/components/ui/Button';
import { History, Save, Download, Filter, Zap } from 'lucide-react';
import { ArticleType } from '@/services/article-type.service';
import { LaundryService } from '@/components/catalogue/ServiceTable';
import { PricingGrid } from './PricingGrid';
import { PricingEntry } from '@/data/mock-pricing';

interface PricingMatrixProps {
    articles: ArticleType[];
    services: LaundryService[];
    pricingData: PricingEntry[];
    isDirty?: boolean;
    onSave?: () => Promise<void>;
    onPriceChange: (articleId: string, serviceId: string, newPrice: number | null) => void;
}

export const PricingMatrix: React.FC<PricingMatrixProps> = ({
    articles,
    services,
    pricingData,
    isDirty = false,
    onSave,
    onPriceChange
}) => {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Grille Tarifaire</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Gérez les prix unitaires pour tous les types d'articles et catégories de services.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {isDirty && (
                        <Button
                            onClick={() => onSave?.()}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md animate-in fade-in zoom-in duration-200"
                            icon={<Save className="h-4 w-4" />}
                        >
                            Enregistrer
                        </Button>
                    )}
                    <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
                    <Button variant="secondary" icon={<Download className="h-4 w-4" />}>
                        Exporter
                    </Button>
                    <Button variant="secondary" icon={<History className="h-4 w-4" />}>
                        Historique
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm cursor-pointer hover:border-gray-300">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Tous les articles</span>
                    </div>
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold ml-2">
                        Dernière mise à jour: Aujourd'hui
                    </span>
                </div>

                <Button
                    variant="ghost"
                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-none shadow-none"
                    icon={<Zap className="h-3 w-3" />}
                >
                    Action Groupée
                </Button>
            </div>

            {/* Grid */}
            <PricingGrid
                articles={articles}
                services={services}
                initialPricing={pricingData}
                onPriceChange={onPriceChange}
            />

            {/* Footer Info */}
            <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                <div>
                    Affichage de <span className="font-bold text-gray-900">{articles.length}</span> sur 42 articles
                </div>
                <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                    Toutes les modifications sont synchronisées
                </div>
                <div className="flex gap-2">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400" disabled>&lt;</button>
                    <span className="px-2 py-1 font-medium text-gray-900">1</span>
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-600">&gt;</button>
                </div>
            </div>

            {/* Usage Tips */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-sm">
                        <span className="h-4 w-4 rounded-full bg-blue-200 flex items-center justify-center text-[10px]">i</span>
                        Mode d'édition rapide
                    </div>
                    <p className="text-xs text-blue-800/70 leading-relaxed">
                        Utilisez les touches fléchées pour naviguer entre les cellules. Appuyez sur Entrée pour valider ou Tab pour passer à la cellule suivante.
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-700 font-bold text-sm">
                        <History className="h-4 w-4" />
                        Restauration des tarifs
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Vous pouvez restaurer les prix à partir d'un catalogue fournisseur spécifique ou d'une sauvegarde précédente.
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-700 font-bold text-sm">
                        {/* Calculator icon placeholder */}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Taxes et Frais
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Les prix saisis ici sont Hors Taxes (HT). La TVA applicable de 20% sera ajoutée automatiquement au panier client.
                    </p>
                </div>
            </div>
        </div>
    );
};
