'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TenantForm, TenantFormData } from '@/components/tenants/TenantForm';
import { TenantService } from '@/services/tenant.service';
import { useToast } from '@/components/ui/simple-toast';
import Link from 'next/link';

export default function CreateTenantPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const handleSubmit = async (data: TenantFormData) => {
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
        showToast('Tenant créé avec succès', 'success');
        router.push('/admin/tenants');
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link
                href="/admin/tenants"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Retour à la liste
            </Link>

            <Card>
                <h2 className="text-xl font-bold text-foreground mb-1">Créer un nouveau tenant</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Configurez un nouveau tenant avec son sous-domaine et son agence principale.
                </p>
                <TenantForm onSubmit={handleSubmit} submitLabel="Créer le tenant" />
            </Card>
        </div>
    );
}
