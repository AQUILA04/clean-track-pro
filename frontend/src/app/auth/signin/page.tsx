'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TENANT_DEACTIVATED_MESSAGE } from '@/lib/tenant-access';

function SignInRedirect() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const error = searchParams.get('error');
    const [flash, setFlash] = useState<string | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('auth_flash');
        if (stored) {
            sessionStorage.removeItem('auth_flash');
            setFlash(stored);
            return;
        }
        if (error === 'TenantDeactivated') {
            setFlash(TENANT_DEACTIVATED_MESSAGE);
        }
    }, [error]);

    useEffect(() => {
        if (error === 'TenantDeactivated' || flash) {
            return;
        }
        void signIn('keycloak', { callbackUrl });
    }, [callbackUrl, error, flash]);

    if (error === 'TenantDeactivated' || flash) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
                <p className="max-w-md text-center text-sm text-red-600">
                    {flash || TENANT_DEACTIVATED_MESSAGE}
                </p>
                <button
                    type="button"
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                    onClick={() => {
                        setFlash(null);
                        void signIn('keycloak', { callbackUrl: '/dashboard' });
                    }}
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <p className="text-sm text-gray-500">Redirection vers la connexion…</p>
        </div>
    );
}

/** Auto-redirects to Keycloak (POST) — used for server-side auth guards. */
export default function SignInPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-gray-50">
                    <p className="text-sm text-gray-500">Chargement…</p>
                </div>
            }
        >
            <SignInRedirect />
        </Suspense>
    );
}
