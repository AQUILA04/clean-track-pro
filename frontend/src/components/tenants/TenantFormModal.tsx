'use client';

import { Modal } from '@/components/ui/modal';
import { TenantForm, TenantFormData } from './TenantForm';
import { Tenant, TenantService } from '@/services/tenant.service';

interface TenantFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingTenant?: Tenant | null;
}

export function TenantFormModal({
    isOpen,
    onClose,
    onSuccess,
    editingTenant,
}: TenantFormModalProps) {
    const isEdit = Boolean(editingTenant);

    const handleSubmit = async (data: TenantFormData) => {
        if (isEdit && editingTenant) {
            await TenantService.update(editingTenant.id, { name: data.name });
        } else {
            const { mainAgency, ...rest } = data;
            await TenantService.create({
                ...rest,
                mainAgency: {
                    name: mainAgency.name,
                    ...(mainAgency.location && { location: mainAgency.location }),
                    ...(mainAgency.city && { city: mainAgency.city }),
                    ...(mainAgency.postal_code && { postal_code: mainAgency.postal_code }),
                    ...(mainAgency.email && { email: mainAgency.email }),
                    ...(mainAgency.phone && { phone: mainAgency.phone }),
                },
            });
        }
        onSuccess();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Modifier le tenant' : 'Créer un nouveau tenant'}
        >
            <TenantForm
                key={editingTenant?.id ?? 'create'}
                initialData={editingTenant ?? undefined}
                isEdit={isEdit}
                onSubmit={handleSubmit}
                onCancel={onClose}
                submitLabel={isEdit ? 'Enregistrer les modifications' : 'Créer le tenant'}
            />
        </Modal>
    );
}
