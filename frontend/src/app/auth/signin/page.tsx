'use client';

import { useEffect, useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AuthErrorPanel } from '@/components/auth/AuthErrorPanel';
import {
    resolveAuthErrorMessage,
    shouldBlockAuthRedirect,
} from '@/lib/auth-errors';
import { TENANT_DEACTIVATED_MESSAGE } from '@/lib/tenant-access';

function SignInRedirect() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const [flash, setFlash] = useState<string | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        const stored = sessionStorage.getItem('auth_flash');
        if (stored) {
            sessionStorage.removeItem('auth_flash');
            return stored;
        }
        return null;
    });

    const resolvedErrorMessage = useMemo(() => {
        if (error === 'TenantDeactivated') {
            return TENANT_DEACTIVATED_MESSAGE;
        }
        return resolveAuthErrorMessage(error, errorDescription) ?? flash;
    }, [error, errorDescription, flash]);

    useEffect(() => {
        if (shouldBlockAuthRedirect(error, resolvedErrorMessage)) {
            return;
        }
        void signIn('keycloak', { callbackUrl });
    }, [callbackUrl, error, resolvedErrorMessage]);

    const handleRetry = () => {
        setFlash(null);
        void signIn('keycloak', { callbackUrl });
    };

    if (resolvedErrorMessage) {
        return (
            <AuthErrorPanel
                message={resolvedErrorMessage}
                onRetry={handleRetry}
                callbackUrl={callbackUrl}
            />
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
