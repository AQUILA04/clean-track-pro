'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import {
    NotificationService,
    TenantNotificationConfig,
} from '@/services/notification.service';
import { useToast } from '@/components/ui/simple-toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { getErrorMessage } from '@/lib/api-error';
import { useTenantConfig } from '@/context/tenant-config.context';
import { formatCurrency } from '@/lib/format-currency';
import { convertAmountSync, fetchRatesPerEur } from '@/lib/fx';
import { PageLoader } from '@/components/ui/loading';

export default function TenantNotificationsSettingsPage() {
    const { toast } = useToast();
    const { currency: tenantCurrency } = useTenantConfig();
    const [config, setConfig] = useState<TenantNotificationConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [smsConfirmOpen, setSmsConfirmOpen] = useState(false);
    const [smsDisplayPrice, setSmsDisplayPrice] = useState<string | null>(null);

    const load = async () => {
        const data = await NotificationService.getTenantConfig();
        setConfig(data);

        if (data.sms_unit_price != null) {
            const platformCurrency = (data.currency || 'EUR').toUpperCase();
            const rates = await fetchRatesPerEur();
            const converted = convertAmountSync(
                Number(data.sms_unit_price),
                platformCurrency,
                tenantCurrency,
                rates,
            );
            const label = formatCurrency(converted, tenantCurrency);
            if (platformCurrency === tenantCurrency) {
                setSmsDisplayPrice(label);
            } else {
                setSmsDisplayPrice(`${label} (≈ ${data.sms_unit_price} ${platformCurrency})`);
            }
        } else {
            setSmsDisplayPrice(null);
        }
    };

    useEffect(() => {
        load().catch((err) => {
            toast({
                title: 'Erreur',
                description: getErrorMessage(err, 'Chargement impossible'),
                variant: 'destructive',
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast, tenantCurrency]);

    const persist = async (patch: Partial<TenantNotificationConfig>) => {
        if (!config) return;

        setSaving(true);
        try {
            await NotificationService.updateTenantConfig({
                notification_email_enabled: patch.notification_email_enabled ?? config.notification_email_enabled,
                notification_sms_enabled: patch.notification_sms_enabled ?? config.notification_sms_enabled,
            });
            await load();
            toast({ title: 'Mis a jour', description: 'Preferences de notification enregistrees.', variant: 'success' });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: getErrorMessage(err, 'Echec de la mise a jour'),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const update = async (patch: Partial<TenantNotificationConfig>) => {
        if (!config) return;
        if (patch.notification_sms_enabled === true) {
            if (config.sms_unit_price == null) {
                toast({
                    title: 'SMS indisponible',
                    description: 'Le Superadmin doit definir le prix unitaire SMS avant activation.',
                    variant: 'destructive',
                });
                return;
            }
            setSmsConfirmOpen(true);
            return;
        }

        await persist(patch);
    };

    const confirmSmsActivation = async () => {
        setSmsConfirmOpen(false);
        await persist({ notification_sms_enabled: true });
    };

    if (!config) {
        return <PageLoader label="Chargement des paramètres…" />;
    }

    const smsPriceLabel = smsDisplayPrice;

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Bell className="h-6 w-6 text-primary" />
                    Canaux de notification
                </h1>
                <p className="text-muted-foreground mt-1">
                    Choisissez comment informer les clients (ex. commande prete au retrait).
                </p>
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border">
                <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <div className="font-semibold text-foreground">Email</div>
                            <div className="text-sm text-muted-foreground">Gratuit</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => update({ notification_email_enabled: !config.notification_email_enabled })}
                        className={`relative h-7 w-12 rounded-full transition-colors ${
                            config.notification_email_enabled ? 'bg-primary' : 'bg-muted'
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                                config.notification_email_enabled ? 'left-5' : 'left-0.5'
                            }`}
                        />
                    </button>
                </div>

                <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <div className="font-semibold text-foreground">SMS</div>
                            <div className="text-sm text-muted-foreground">
                                {smsPriceLabel
                                    ? `${smsPriceLabel} / SMS`
                                    : 'Tarif non defini par la plateforme'}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={saving || config.sms_unit_price == null}
                        onClick={() => update({ notification_sms_enabled: !config.notification_sms_enabled })}
                        className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-40 ${
                            config.notification_sms_enabled ? 'bg-primary' : 'bg-muted'
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                                config.notification_sms_enabled ? 'left-5' : 'left-0.5'
                            }`}
                        />
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={smsConfirmOpen}
                onClose={() => setSmsConfirmOpen(false)}
                onConfirm={confirmSmsActivation}
                title="Activer les SMS ?"
                message={`Chaque SMS sera facturé environ ${smsPriceLabel}. Confirmez pour activer ce canal.`}
                confirmLabel="Activer"
                cancelLabel="Annuler"
                variant="warning"
            />
        </div>
    );
}
