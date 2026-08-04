'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { TenantsTable } from '@/components/tenants/TenantsTable';
import { TenantFormModal } from '@/components/tenants/TenantFormModal';
import { Tenant, TenantService } from '@/services/tenant.service';
import { useToast } from '@/components/ui/simple-toast';

export default function TenantsPage() {
    const { showToast } = useToast();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
    const [deactivatingTenant, setDeactivatingTenant] = useState<Tenant | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const data = await TenantService.getAll();
            setTenants(data);
        } catch {
            showToast('Impossible de charger les tenants', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredTenants = tenants.filter((tenant) => {
        const query = searchQuery.toLowerCase();
        return (
            tenant.name.toLowerCase().includes(query) ||
            tenant.subdomain.toLowerCase().includes(query)
        );
    });

    const handleCreate = () => {
        setEditingTenant(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (tenant: Tenant) => {
        setEditingTenant(tenant);
        setIsFormModalOpen(true);
    };

    const handleFormSuccess = () => {
        showToast(
            editingTenant ? 'Tenant mis à jour avec succès' : 'Tenant créé avec succès',
            'success',
        );
        fetchTenants();
    };

    const handleDeleteConfirm = async () => {
        if (!deletingTenant) return;
        try {
            await TenantService.delete(deletingTenant.id);
            showToast('Tenant supprimé avec succès', 'success');
            setDeletingTenant(null);
            fetchTenants();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Impossible de supprimer le tenant';
            showToast(message, 'error');
        }
    };

    const applyActiveStatus = async (tenant: Tenant, isActive: boolean) => {
        setTogglingId(tenant.id);
        try {
            await TenantService.setActive(tenant.id, isActive);
            showToast(
                isActive
                    ? `Le tenant « ${tenant.name} » est maintenant actif`
                    : `Le tenant « ${tenant.name} » a été désactivé`,
                'success',
            );
            fetchTenants();
        } catch {
            showToast('Impossible de modifier le statut du tenant', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleToggleActive = (tenant: Tenant, isActive: boolean) => {
        if (!isActive) {
            setDeactivatingTenant(tenant);
            return;
        }
        applyActiveStatus(tenant, true);
    };

    const handleDeactivateConfirm = async () => {
        if (!deactivatingTenant) return;
        await applyActiveStatus(deactivatingTenant, false);
        setDeactivatingTenant(null);
    };

    return (
        <div className="flex flex-col min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Gestion des tenants</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} enregistré
                            {tenants.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouveau tenant
                    </Button>
                </div>
            </div>

            <Card padding="none">
                <TenantsTable
                    tenants={filteredTenants}
                    onEdit={handleEdit}
                    onDelete={setDeletingTenant}
                    onToggleActive={handleToggleActive}
                    loading={loading}
                    togglingId={togglingId}
                />
            </Card>

            <TenantFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSuccess={handleFormSuccess}
                editingTenant={editingTenant}
            />

            <ConfirmationModal
                isOpen={Boolean(deactivatingTenant)}
                onClose={() => setDeactivatingTenant(null)}
                onConfirm={handleDeactivateConfirm}
                title="Désactiver le tenant ?"
                message={`Les utilisateurs du tenant « ${deactivatingTenant?.name} » ne pourront plus accéder à la plateforme tant qu'il sera désactivé.`}
                confirmLabel="Désactiver"
                cancelLabel="Annuler"
                variant="warning"
            />

            <ConfirmationModal
                isOpen={Boolean(deletingTenant)}
                onClose={() => setDeletingTenant(null)}
                onConfirm={handleDeleteConfirm}
                title="Supprimer le tenant ?"
                message={`Cette action est irréversible. Le tenant « ${deletingTenant?.name} » et toutes ses données associées seront supprimés.`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
            />
        </div>
    );
}
