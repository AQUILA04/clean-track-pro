'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { clientSchema, ClientFormValues } from '@/lib/validations/client';
import { ClientService, ClientRecord } from '@/services/client.service';

type ClientRegistrationFormProps = {
    mode?: 'create' | 'edit';
    clientId?: string;
    defaultValues?: Partial<ClientFormValues>;
    onSuccess?: (client: ClientRecord) => void;
    submitLabel?: string;
    compact?: boolean;
};

export function ClientRegistrationForm({
    mode = 'create',
    clientId,
    defaultValues,
    onSuccess,
    submitLabel,
    compact = false,
}: ClientRegistrationFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            first_name: defaultValues?.first_name || '',
            last_name: defaultValues?.last_name || '',
            phone: defaultValues?.phone || '',
            email: defaultValues?.email || '',
            notes: defaultValues?.notes || '',
        },
    });

    const onSubmit = async (data: ClientFormValues) => {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...data,
                email: data.email || undefined,
            };
            const client =
                mode === 'edit' && clientId
                    ? await ClientService.update(clientId, payload)
                    : await ClientService.create(payload);

            if (onSuccess) {
                onSuccess(client);
            } else if (mode === 'edit' && clientId) {
                router.push(`/clients/${clientId}`);
            } else {
                router.push(`/clients/${client.id}`);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const inputClassName =
        'w-full px-3 py-2 rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';

    const defaultSubmit =
        mode === 'edit' ? 'Enregistrer' : loading ? 'Création...' : 'Créer le client';

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className={`space-y-6 ${compact ? '' : 'max-w-lg bg-card p-6 rounded-xl border border-border'}`}
        >
            {!compact && (
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                        {mode === 'edit' ? 'Modifier le client' : 'Nouveau client'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {mode === 'edit'
                            ? 'Mettez à jour les informations du client.'
                            : 'Renseignez les informations pour générer un code unique.'}
                    </p>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded border border-red-500/30">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="first_name" className="block text-sm font-medium text-foreground">
                        Prénom *
                    </label>
                    <input {...register('first_name')} id="first_name" className={inputClassName} placeholder="Jean" />
                    {errors.first_name && <p className="text-red-400 text-xs">{errors.first_name.message}</p>}
                </div>

                <div className="space-y-1">
                    <label htmlFor="last_name" className="block text-sm font-medium text-foreground">
                        Nom *
                    </label>
                    <input {...register('last_name')} id="last_name" className={inputClassName} placeholder="Dupont" />
                    {errors.last_name && <p className="text-red-400 text-xs">{errors.last_name.message}</p>}
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                    Téléphone * (E.164)
                </label>
                <input
                    {...register('phone')}
                    id="phone"
                    className={inputClassName}
                    placeholder="+33612345678"
                />
                {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email (optionnel)
                </label>
                <input
                    {...register('email')}
                    id="email"
                    type="email"
                    className={inputClassName}
                    placeholder="jean@example.com"
                />
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="notes" className="block text-sm font-medium text-foreground">
                    Notes (optionnel)
                </label>
                <textarea
                    {...register('notes')}
                    id="notes"
                    rows={3}
                    className={inputClassName}
                    placeholder="Informations complémentaires..."
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Enregistrement...' : submitLabel || defaultSubmit}
            </button>
        </form>
    );
}
