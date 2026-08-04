'use client';

import { useEffect, useRef } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import type { ReactNode } from 'react';
import { logout } from '@/lib/logout';
import { TENANT_DEACTIVATED_MESSAGE } from '@/lib/tenant-access';

function SessionExpiryHandler() {
    const { data: session } = useSession();
    const isSigningOut = useRef(false);

    useEffect(() => {
        if (isSigningOut.current) {
            return;
        }

        if (
            session?.error === 'RefreshAccessTokenError' ||
            session?.error === 'TenantDeactivated'
        ) {
            isSigningOut.current = true;
            if (session.error === 'TenantDeactivated' && typeof window !== 'undefined') {
                sessionStorage.setItem('auth_flash', TENANT_DEACTIVATED_MESSAGE);
            }
            logout();
        }
    }, [session]);

    return null;
}

export default function AppSessionProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <SessionExpiryHandler />
            {children}
        </SessionProvider>
    );
}
