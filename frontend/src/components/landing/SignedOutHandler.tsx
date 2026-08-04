'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

/** Clears any leftover client session after federated logout. */
export function SignedOutHandler() {
    useEffect(() => {
        void signOut({ redirect: false });
    }, []);

    return null;
}
