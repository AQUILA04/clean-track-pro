import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Zap, Info, Check, Eye } from 'lucide-react';

interface ExpressModeProps {
    initialData?: {
        enabled: boolean;
        multiplier: string;
        guaranteedDelivery: string;
        currency: string;
        weightUnit: string;
        visibility: {
            showTTC: boolean;
            allowDiscounts: boolean;
            showInventory: boolean;
        };
    };
    onSave?: (data: any) => Promise<void>;
}

const DEFAULT_DATA = {
    enabled: true,
    multiplier: '1.5',
    guaranteedDelivery: '24',
    currency: 'Euro (€)',
    weightUnit: 'Kilogrammes (kg)',
    visibility: {
        showTTC: true,
        allowDiscounts: true,
        showInventory: false
    }
};

export const ExpressMode: React.FC<ExpressModeProps> = ({ initialData = DEFAULT_DATA, onSave }) => {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        if (initialData) {
            setData(initialData);
        }
    }, [initialData]);

    const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, multiplier: e.target.value });
    };

    const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, guaranteedDelivery: e.target.value });
    };

    const handleVisibilityChange = (key: keyof typeof data.visibility) => {
        setData({
            ...data,
            visibility: { ...data.visibility, [key]: !data.visibility[key] }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header with Cancel/Save - Optional since bottom buttons exist, but design had them. Keeping minimal based on tab context. */}
            {/* Main Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <Zap className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Configuration Mode Express</h3>
                            <p className="text-gray-500 text-sm mt-1 max-w-xl">
                                Le mode express permet aux clients de prioriser leurs commandes moyennant des frais supplémentaires.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={data.enabled}
                            onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
                        />
                        <span className={`font-bold ${data.enabled ? 'text-orange-600' : 'text-gray-400'}`}>
                            {data.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Multiplier */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-bold text-gray-700">Multiplicateur de prix</label>
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                        </div>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold text-xl">x</div>
                            <input
                                type="text"
                                value={data.multiplier}
                                onChange={handleMultiplierChange}
                                className="w-full pl-10 pr-4 py-4 bg-orange-50 border-2 border-orange-100 rounded-xl text-3xl font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-0 transition-colors"
                            />
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Exemple: Un service à 10,00€ deviendra <span className="font-bold text-orange-600">{(10 * parseFloat(data.multiplier || '0')).toFixed(2).replace('.', ',')}€</span>
                        </p>
                    </div>

                    {/* Delivery Time */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-bold text-gray-700">Délai de livraison garanti</label>
                            <Info className="h-3 w-3 text-gray-400 cursor-help" />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.guaranteedDelivery}
                                onChange={handleDeliveryChange}
                                className="w-full pl-6 pr-20 py-4 bg-gray-50 border border-gray-200 rounded-xl text-3xl font-bold text-gray-900 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">heures</div>
                        </div>
                        <p className="mt-3 text-xs text-gray-500">
                            Délai standard: 48-72 heures
                        </p>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <h3 className="text-lg font-bold text-gray-900 pt-4">Paramètres Généraux du Catalogue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Currency */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Devise par défaut</label>
                    <select
                        value={data.currency}
                        onChange={(e) => setData({ ...data, currency: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:ring-0"
                    >
                        <option>Euro (€)</option>
                        <option>Dollar ($)</option>
                        <option>Livre Sterling (£)</option>
                    </select>
                </div>

                {/* Weight Unit */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Unité de poids</label>
                    <select
                        value={data.weightUnit}
                        onChange={(e) => setData({ ...data, weightUnit: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:border-gray-400 focus:ring-0"
                    >
                        <option>Kilogrammes (kg)</option>
                        <option>Livres (lb)</option>
                    </select>
                </div>
            </div>

            {/* Visibility Options */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Options de visibilité</h4>
                <div className="space-y-4">
                    {/* Show TTC */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${data.visibility.showTTC ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}
                            onClick={() => handleVisibilityChange('showTTC')}>
                            {data.visibility.showTTC && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Afficher les prix TTC sur le catalogue client</span>
                    </label>

                    {/* Allow Discounts */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${data.visibility.allowDiscounts ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}
                            onClick={() => handleVisibilityChange('allowDiscounts')}>
                            {data.visibility.allowDiscounts && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Autoriser les remises sur le mode Express</span>
                    </label>

                    {/* Show Inventory */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${data.visibility.showInventory ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}
                            onClick={() => handleVisibilityChange('showInventory')}>
                            {data.visibility.showInventory && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Afficher l'inventaire en temps réel</span>
                    </label>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end pt-4 pb-8 gap-4 border-t border-gray-100 mt-8">
                <Button
                    variant="secondary"
                    className="font-medium text-gray-600"
                    onClick={() => setData(initialData)} // Reset local
                >
                    Réinitialiser
                </Button>
                <Button
                    className="bg-[#FF6B00] hover:bg-[#E65F00] text-white font-bold px-8 shadow-lg shadow-orange-500/20"
                    onClick={() => onSave?.(data)}
                >
                    Confirmer & Sauvegarder
                </Button>
            </div>

            {/* Preview Banner */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4">
                <div className="bg-[#FFE4CF] border border-orange-200 rounded-full py-3 px-6 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-orange-500 rounded-full p-1">
                        <Eye className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">Prévisualisation en cours</p>
                        <p className="text-xs text-gray-600">Ces modifications affecteront les 12 établissements de votre réseau dès la validation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
