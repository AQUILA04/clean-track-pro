'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientRegistrationForm } from '@/components/clients/ClientRegistrationForm';

function NewClientContent() {
    const searchParams = useSearchParams();

    const defaultValues = useMemo(() => {
        const phone = searchParams.get('phone') || '';
        const name = searchParams.get('name') || '';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        return {
            phone: phone || undefined,
            first_name: parts[0] || undefined,
            last_name: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
        };
    }, [searchParams]);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <Link href="/clients" className="text-sm text-muted-foreground hover:text-foreground">
                    ← Clients
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-foreground">Nouveau client</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Enregistrez un client et générez son code d&apos;identification unique.
                </p>
            </div>

            <div className="flex justify-center">
                <ClientRegistrationForm defaultValues={defaultValues} />
            </div>
        </div>
    );
}

export default function NewClientPage() {
    return (
        <Suspense fallback={<div className="p-8 text-muted-foreground">Chargement...</div>}>
            <NewClientContent />
        </Suspense>
    );
}
