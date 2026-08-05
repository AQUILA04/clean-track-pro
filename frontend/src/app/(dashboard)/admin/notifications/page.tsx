'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationService, PlatformNotificationSettings } from '@/services/notification.service';
import { useToast } from '@/components/ui/simple-toast';
import { getErrorMessage } from '@/lib/api-error';
import { PageLoader } from '@/components/ui/loading';

export default function AdminNotificationsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PlatformNotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        NotificationService.getPlatformSettings()
            .then((s) => {
                setSettings(s);
                setPrice(s.sms_unit_price != null ? String(s.sms_unit_price) : '');
                setCurrency(s.currency === 'USD' ? 'USD' : 'EUR');
            })
            .catch((err) => {
                toast({
                    title: 'Erreur',
                    description: getErrorMessage(err, 'Chargement impossible'),
                    variant: 'destructive',
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const sms_unit_price = price.trim() === '' ? null : Number(price);
            if (sms_unit_price !== null && (Number.isNaN(sms_unit_price) || sms_unit_price < 0)) {
                throw new Error('Prix SMS invalide');
            }
            const updated = await NotificationService.updatePlatformSettings({
                sms_unit_price,
                currency,
            });
            setSettings(updated);
            toast({ title: 'Enregistre', description: 'Tarif SMS plateforme mis a jour.', variant: 'success' });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: getErrorMessage(err, 'Echec de la sauvegarde'),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <PageLoader label="Chargement des paramètres…" />;
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Bell className="h-6 w-6 text-primary" />
                    Notifications plateforme
                </h1>
                <p className="text-muted-foreground mt-1">
                    Definissez le prix unitaire SMS facture aux tenants (EUR ou USD). L&apos;email reste gratuit.
                    Les Managers généraux voient ce tarif converti dans la devise de leur entreprise.
                </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div>
                    <label className="text-sm text-muted-foreground">Prix unitaire SMS</label>
                    <input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="ex. 0.05"
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                    />
                </div>
                <div>
                    <label className="text-sm text-muted-foreground">Devise de facturation</label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'EUR' | 'USD')}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                    >
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </div>
                {settings && (
                    <p className="text-xs text-muted-foreground">
                        Actuel :{' '}
                        {settings.sms_unit_price != null
                            ? `${settings.sms_unit_price} ${settings.currency}`
                            : 'non defini'}
                    </p>
                )}
                <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                    Enregistrer
                </button>
            </div>
        </div>
    );
}
