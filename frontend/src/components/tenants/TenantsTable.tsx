'use client';

import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Tenant } from '@/services/tenant.service';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ContentLoader } from '@/components/ui/loading';

interface TenantsTableProps {
    tenants: Tenant[];
    onEdit: (tenant: Tenant) => void;
    onDelete: (tenant: Tenant) => void;
    onToggleActive: (tenant: Tenant, isActive: boolean) => void;
    loading?: boolean;
    togglingId?: string | null;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function TenantsTable({
    tenants,
    onEdit,
    onDelete,
    onToggleActive,
    loading,
    togglingId,
}: TenantsTableProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card">
                <ContentLoader label="Chargement des tenants…" />
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">Aucun tenant trouvé.</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Créez votre premier tenant pour commencer.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead>
                        <tr className="bg-muted/30">
                            <th className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Agence
                            </th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Sous-domaine
                            </th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Statut
                            </th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Express
                            </th>
                            <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Créé le
                            </th>
                            <th className="py-3.5 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {tenants.map((tenant) => {
                            const isActive = tenant.is_active !== false;
                            const isToggling = togglingId === tenant.id;

                            return (
                                <tr
                                    key={tenant.id}
                                    className={`hover:bg-muted/30 transition-colors ${!isActive ? 'opacity-60' : ''}`}
                                >
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                {tenant.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-foreground">
                                                {tenant.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <a
                                            href={`https://${tenant.subdomain}.cleantrack.pro`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {tenant.subdomain}.cleantrack.pro
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={isActive}
                                                disabled={isToggling}
                                                onCheckedChange={(checked) =>
                                                    onToggleActive(tenant, checked)
                                                }
                                                id={`tenant-active-${tenant.id}`}
                                            />
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    isActive
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                }`}
                                            >
                                                {isActive ? 'Actif' : 'Désactivé'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                tenant.express_enabled
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {tenant.express_enabled ? 'Activé' : 'Désactivé'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                        {formatDate(tenant.created_at)}
                                    </td>
                                    <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(tenant)}
                                                aria-label={`Modifier ${tenant.name}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => onDelete(tenant)}
                                                aria-label={`Supprimer ${tenant.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
