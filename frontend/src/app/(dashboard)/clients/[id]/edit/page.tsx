'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClientRegistrationForm } from '@/components/clients/ClientRegistrationForm';
import { ClientService, ClientRecord } from '@/services/client.service';
import { PageLoader } from '@/components/ui/loading';

export default function EditClientPage() {
    const params = useParams();
    const clientId = params.id as string;
    const [client, setClient] = useState<ClientRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await ClientService.getById(clientId);
                if (!cancelled) setClient(data);
            } catch {
                if (!cancelled) setError('Impossible de charger le client.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [clientId]);

    if (loading) {
        return <PageLoader label="Chargement du client…" />;
    }

    if (error || !client) {
        return (
            <div className="space-y-4 py-8">
                <Link href="/clients" className="text-sm text-muted-foreground hover:text-foreground">
                    ← Clients
                </Link>
                <p className="text-red-400">{error || 'Client introuvable.'}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <Link
                    href={`/clients/${clientId}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← {client.first_name} {client.last_name}
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-foreground">Modifier le client</h1>
            </div>
            <div className="flex justify-center">
                <ClientRegistrationForm
                    key={clientId}
                    mode="edit"
                    clientId={clientId}
                    defaultValues={{
                        first_name: client.first_name,
                        last_name: client.last_name,
                        phone: client.phone,
                        email: client.email || '',
                        notes: client.notes || '',
                    }}
                />
            </div>
        </div>
    );
}
