'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Image as ImageIcon,
    Building2,
    FileText,
    Upload,
    Globe,
    Coins,
    Check,
    Loader2,
} from 'lucide-react';
import { BrandPreview } from '@/components/settings/BrandPreview';
import { HelpCard } from '@/components/settings/HelpCard';
import { FileUploader } from '@/components/settings/FileUploader';
import { POPULAR_CURRENCIES, normalizeCurrencyCode, getCurrencyLabel } from '@/lib/currencies';
import { TenantService } from '@/services/tenant.service';
import { StorageService } from '@/services/storage.service';
import { useTenantConfig } from '@/context/tenant-config.context';
import { useToast } from '@/components/ui/simple-toast';
import { PageLoader } from '@/components/ui/loading';

const selectClassName =
    'w-full px-4 py-3 bg-card border border-border rounded-sm text-foreground font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10';

const textareaClassName =
    'w-full p-4 bg-card border border-border rounded-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px]';

interface BrandingFormState {
    name: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    address: string;
    legal_id: string;
    vat_number: string;
}

const emptyBranding = (): BrandingFormState => ({
    name: '',
    logoUrl: null,
    faviconUrl: null,
    address: '',
    legal_id: '',
    vat_number: '',
});

export default function SettingsPage() {
    const { tenant, currency: activeCurrency, setCurrency, refresh, loading: tenantLoading } =
        useTenantConfig();
    const { toast } = useToast();

    const [selectedCurrency, setSelectedCurrency] = useState(activeCurrency);
    const [savingCurrency, setSavingCurrency] = useState(false);
    const [currencyLoaded, setCurrencyLoaded] = useState(false);

    const [form, setForm] = useState<BrandingFormState>(emptyBranding);
    const [baseline, setBaseline] = useState<BrandingFormState>(emptyBranding);
    const [savingBranding, setSavingBranding] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);

    useEffect(() => {
        // Wait for tenant config so we don't flash the product default (XOF)
        // over the tenant's real stored currency (e.g. EUR on older orgs).
        if (tenantLoading) return;
        setSelectedCurrency(activeCurrency);
        setCurrencyLoaded(true);
    }, [activeCurrency, tenantLoading]);

    useEffect(() => {
        if (!tenant) return;
        const next: BrandingFormState = {
            name: tenant.name || '',
            logoUrl: tenant.logoUrl || null,
            faviconUrl: tenant.faviconUrl || null,
            address: tenant.address || '',
            legal_id: tenant.legal_id || '',
            vat_number: tenant.vat_number || '',
        };
        setForm(next);
        setBaseline(next);
    }, [tenant]);

    const brandingDirty = useMemo(() => {
        return (
            form.name.trim() !== baseline.name.trim() ||
            (form.logoUrl || null) !== (baseline.logoUrl || null) ||
            (form.faviconUrl || null) !== (baseline.faviconUrl || null) ||
            form.address.trim() !== baseline.address.trim() ||
            form.legal_id.trim() !== baseline.legal_id.trim() ||
            form.vat_number.trim() !== baseline.vat_number.trim()
        );
    }, [form, baseline]);

    const currencyDirty = currencyLoaded && selectedCurrency !== activeCurrency;
    const anyDirty = brandingDirty || currencyDirty;

    const updateField = useCallback(<K extends keyof BrandingFormState>(key: K, value: BrandingFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleUpload = async (file: File, kind: 'logo' | 'favicon') => {
        const setUploading = kind === 'logo' ? setUploadingLogo : setUploadingFavicon;
        const field = kind === 'logo' ? 'logoUrl' : 'faviconUrl';
        const localPreview = URL.createObjectURL(file);
        updateField(field, localPreview);
        setUploading(true);
        try {
            const url = await StorageService.uploadFile(file);
            URL.revokeObjectURL(localPreview);
            updateField(field, url);
            toast({
                title: kind === 'logo' ? 'Logo téléversé' : 'Favicon téléversé',
                description: 'N’oubliez pas d’enregistrer pour appliquer le branding.',
            });
        } catch (err) {
            URL.revokeObjectURL(localPreview);
            updateField(field, baseline[field]);
            toast({
                title: 'Échec du téléversement',
                description: err instanceof Error ? err.message : 'Impossible d’envoyer le fichier.',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setForm(baseline);
        setSelectedCurrency(activeCurrency);
    };

    const handleSaveCurrency = async () => {
        const code = normalizeCurrencyCode(selectedCurrency);
        setSavingCurrency(true);
        try {
            const current = await TenantService.getCurrentTenant();
            await TenantService.updateConfig({
                express_multiplier: Number(current.express_multiplier),
                express_sla_hours: Number(current.express_sla_hours),
                express_enabled: current.express_enabled,
                currency: code,
                weight_unit: current.weight_unit,
                express_visibility: current.express_visibility,
            });
            setCurrency(code);
            await refresh();
            toast({
                title: 'Devise enregistrée',
                description: `La devise active est désormais ${code}.`,
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: err instanceof Error ? err.message : 'Impossible d’enregistrer la devise.',
                variant: 'destructive',
            });
        } finally {
            setSavingCurrency(false);
        }
    };

    const handleSaveAll = async () => {
        const name = form.name.trim();
        if (brandingDirty && !name) {
            toast({
                title: 'Nom requis',
                description: 'Le nom de l’organisation ne peut pas être vide.',
                variant: 'destructive',
            });
            return;
        }

        setSavingBranding(true);
        try {
            if (brandingDirty) {
                await TenantService.updateBranding({
                    name,
                    logoUrl: form.logoUrl,
                    faviconUrl: form.faviconUrl,
                    address: form.address.trim() || null,
                    legal_id: form.legal_id.trim() || null,
                    vat_number: form.vat_number.trim() || null,
                });
            }
            if (currencyDirty) {
                const code = normalizeCurrencyCode(selectedCurrency);
                setSavingCurrency(true);
                const current = await TenantService.getCurrentTenant();
                await TenantService.updateConfig({
                    express_multiplier: Number(current.express_multiplier),
                    express_sla_hours: Number(current.express_sla_hours),
                    express_enabled: current.express_enabled,
                    currency: code,
                    weight_unit: current.weight_unit,
                    express_visibility: current.express_visibility,
                });
                setCurrency(code);
            }
            await refresh();
            toast({
                title: 'Paramètres enregistrés',
                description: brandingDirty
                    ? 'Identité et configuration mises à jour (navigation et reçus).'
                    : 'Configuration mise à jour.',
            });
        } catch (err) {
            toast({
                title: 'Erreur',
                description: err instanceof Error ? err.message : 'Impossible d’enregistrer.',
                variant: 'destructive',
            });
        } finally {
            setSavingBranding(false);
            setSavingCurrency(false);
        }
    };

    const busy = savingBranding || savingCurrency || uploadingLogo || uploadingFavicon;

    if (tenantLoading) {
        return <PageLoader label="Chargement des paramètres…" />;
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Paramètres généraux & branding
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Configurez l’identité de votre réseau : logo, nom d’organisation et mentions
                        légales. Elles s’appliquent à la navigation et aux reçus.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="ghost"
                        className="border border-border text-foreground hover:bg-muted"
                        onClick={handleCancel}
                        disabled={!anyDirty || busy}
                    >
                        Annuler
                    </Button>
                    <Button
                        className="bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                        onClick={handleSaveAll}
                        disabled={!anyDirty || busy || tenantLoading}
                    >
                        {busy ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enregistrement…
                            </>
                        ) : (
                            'Enregistrer les modifications'
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-secondary rounded-lg">
                                <Coins className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Devise de l&apos;entreprise</h2>
                                <p className="text-sm text-muted-foreground">
                                    Devise utilisée pour le catalogue, les commandes, les paiements et les
                                    rapports.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Devise active
                                </label>
                                <select
                                    value={currencyLoaded ? selectedCurrency : ''}
                                    onChange={(e) => setSelectedCurrency(e.target.value)}
                                    className={selectClassName}
                                    disabled={savingCurrency || tenantLoading || !currencyLoaded}
                                >
                                    {!currencyLoaded && (
                                        <option value="">Chargement…</option>
                                    )}
                                    {POPULAR_CURRENCIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.name} — {c.code} ({c.symbol})
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {currencyDirty ? (
                                        <>
                                            Aperçu : {getCurrencyLabel(selectedCurrency)}. Enregistrez pour
                                            l&apos;appliquer à toute l&apos;application.
                                        </>
                                    ) : (
                                        <>
                                            Devise enregistrée : {getCurrencyLabel(activeCurrency)}.
                                            Les nouveaux réseaux démarrent en Franc CFA (XOF).
                                        </>
                                    )}
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveCurrency}
                                    disabled={!currencyDirty || savingCurrency}
                                    className="bg-primary hover:bg-blue-700 text-white"
                                >
                                    {savingCurrency ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Enregistrement…
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Enregistrer la devise
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-secondary rounded-lg">
                                <ImageIcon className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Identité visuelle</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUploader
                                title="Logo principal du réseau"
                                icon={Upload}
                                label="Cliquer pour téléverser"
                                sublabel="Recommandé : PNG ou SVG transparent, max. 2 Mo"
                                value={form.logoUrl}
                                uploading={uploadingLogo}
                                onChange={(file) => handleUpload(file, 'logo')}
                                onClear={() => updateField('logoUrl', null)}
                                disabled={busy}
                            />
                            <FileUploader
                                title="Favicon"
                                icon={Globe}
                                label="Choisir un fichier"
                                sublabel="32×32 ou 64×64 px (ICO, PNG)"
                                aspectRatio="square"
                                accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp"
                                value={form.faviconUrl}
                                uploading={uploadingFavicon}
                                onChange={(file) => handleUpload(file, 'favicon')}
                                onClear={() => updateField('faviconUrl', null)}
                                disabled={busy}
                            />
                        </div>
                    </Card>

                    <Card className="shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-secondary rounded-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Informations entreprise</h2>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="Nom de l'organisation"
                                value={form.name}
                                onChange={(e) => updateField('name', e.target.value)}
                                placeholder="Nom de votre réseau"
                                disabled={tenantLoading}
                            />

                            <div className="w-full">
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Adresse du siège
                                </label>
                                <textarea
                                    className={textareaClassName}
                                    value={form.address}
                                    onChange={(e) => updateField('address', e.target.value)}
                                    placeholder="Adresse affichée sur les reçus et documents"
                                    disabled={tenantLoading}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-secondary rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">
                                Informations de facturation &amp; légales
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Identifiant légal (SIRET, RCCM…)"
                                value={form.legal_id}
                                onChange={(e) => updateField('legal_id', e.target.value)}
                                className="font-mono"
                                placeholder="Optionnel"
                                disabled={tenantLoading}
                            />
                            <Input
                                label="Numéro de TVA"
                                value={form.vat_number}
                                onChange={(e) => updateField('vat_number', e.target.value)}
                                className="font-mono"
                                placeholder="Optionnel"
                                disabled={tenantLoading}
                            />
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <BrandPreview
                        organizationName={form.name || tenant?.name || 'Organisation'}
                        logoUrl={form.logoUrl}
                        address={form.address}
                        legalId={form.legal_id}
                        vatNumber={form.vat_number}
                        currency={selectedCurrency || activeCurrency}
                    />
                    <HelpCard />
                </div>
            </div>
        </div>
    );
}
