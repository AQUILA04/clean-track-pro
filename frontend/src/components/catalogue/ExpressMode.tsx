import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Zap, Info, Check, Eye } from 'lucide-react';
import { POPULAR_CURRENCIES, DEFAULT_TENANT_CURRENCY } from '@/lib/currencies';
import { formatCurrency } from '@/lib/format-currency';

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
    currency: DEFAULT_TENANT_CURRENCY,
    weightUnit: 'Kilogrammes (kg)',
    visibility: {
        showTTC: true,
        allowDiscounts: true,
        showInventory: false
    }
};

const selectClassName =
    'w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10';

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

    const multiplier = parseFloat(data.multiplier || '0') || 0;

    return (
        <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Zap className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Configuration Mode Express</h3>
                            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                                Le mode express permet aux clients de prioriser leurs commandes moyennant des frais supplémentaires.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={data.enabled}
                            onCheckedChange={(checked) => setData({ ...data, enabled: checked })}
                        />
                        <span className={`font-bold ${data.enabled ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            {data.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-bold text-foreground">Multiplicateur de prix</label>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </div>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold text-xl">x</div>
                            <input
                                type="text"
                                value={data.multiplier}
                                onChange={handleMultiplierChange}
                                className="w-full pl-10 pr-4 py-4 bg-orange-500/10 border-2 border-orange-500/20 rounded-xl text-3xl font-bold text-foreground focus:outline-none focus:border-orange-500 focus:ring-0 transition-colors"
                            />
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Exemple: Un service à {formatCurrency(10, data.currency)} deviendra{' '}
                            <span className="font-bold text-orange-500">
                                {formatCurrency(10 * multiplier, data.currency)}
                            </span>
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-bold text-foreground">Délai de livraison garanti</label>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.guaranteedDelivery}
                                onChange={handleDeliveryChange}
                                className="w-full pl-6 pr-20 py-4 bg-muted border border-border rounded-xl text-3xl font-bold text-foreground focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">heures</div>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Délai standard: 48-72 heures
                        </p>
                    </div>
                </div>
            </div>

            <h3 className="text-lg font-bold text-foreground pt-4">Paramètres Généraux du Catalogue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Devise par défaut</label>
                    <select
                        value={data.currency}
                        onChange={(e) => setData({ ...data, currency: e.target.value })}
                        className={selectClassName}
                    >
                        {POPULAR_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.name} — {c.code} ({c.symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Unité de poids</label>
                    <select
                        value={data.weightUnit}
                        onChange={(e) => setData({ ...data, weightUnit: e.target.value })}
                        className={selectClassName}
                    >
                        <option>Kilogrammes (kg)</option>
                        <option>Livres (lb)</option>
                    </select>
                </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-6 border border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Options de visibilité</h4>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${data.visibility.showTTC ? 'bg-orange-500 border-orange-500' : 'bg-card border-border'}`}
                            onClick={() => handleVisibilityChange('showTTC')}>
                            {data.visibility.showTTC && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary">Afficher les prix TTC sur le catalogue client</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${data.visibility.allowDiscounts ? 'bg-orange-500 border-orange-500' : 'bg-card border-border'}`}
                            onClick={() => handleVisibilityChange('allowDiscounts')}>
                            {data.visibility.allowDiscounts && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary">Autoriser les remises sur le mode Express</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${data.visibility.showInventory ? 'bg-orange-500 border-orange-500' : 'bg-card border-border'}`}
                            onClick={() => handleVisibilityChange('showInventory')}>
                            {data.visibility.showInventory && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary">Afficher l'inventaire en temps réel</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end pt-4 pb-8 gap-4 border-t border-border mt-8">
                <Button
                    variant="ghost"
                    className="font-medium text-muted-foreground border border-border hover:bg-muted"
                    onClick={() => setData(initialData)}
                >
                    Réinitialiser
                </Button>
                <Button
                    className="bg-accent hover:bg-[#E65F00] text-white font-bold px-8 shadow-lg shadow-orange-500/20"
                    onClick={() => onSave?.(data)}
                >
                    Confirmer & Sauvegarder
                </Button>
            </div>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4">
                <div className="bg-orange-500/15 dark:bg-orange-500/20 border border-orange-500/30 rounded-full py-3 px-6 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="bg-orange-500 rounded-full p-1">
                        <Eye className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">Prévisualisation en cours</p>
                        <p className="text-xs text-muted-foreground">Ces modifications affecteront les 12 établissements de votre réseau dès la validation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
