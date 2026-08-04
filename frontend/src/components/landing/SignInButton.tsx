'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowRight, Loader2 } from 'lucide-react';

type SignInButtonVariant = 'nav' | 'navPrimary' | 'hero' | 'cta' | 'footer';

interface SignInButtonProps {
    variant?: SignInButtonVariant;
    children?: React.ReactNode;
    showArrow?: boolean;
}

const variantStyles: Record<SignInButtonVariant, string> = {
    nav: 'rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900',
    navPrimary:
        'rounded-lg bg-[#1A5AD7] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1548B0]',
    hero: 'inline-flex items-center gap-2 rounded-xl bg-[#1A5AD7] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-[#1548B0] hover:shadow-blue-500/40',
    cta: 'inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#1A5AD7] transition-all hover:bg-blue-50',
    footer: 'text-sm font-medium text-[#1A5AD7] transition-colors hover:underline',
};

export function SignInButton({
    variant = 'hero',
    children = 'Se connecter',
    showArrow = false,
}: SignInButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleSignIn = () => {
        setLoading(true);
        // POST via NextAuth → redirect direct vers Keycloak (pas la page intermédiaire GET)
        void signIn('keycloak', { callbackUrl: '/dashboard' });
    };

    return (
        <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className={`${variantStyles[variant]} disabled:opacity-70`}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Connexion…
                </>
            ) : (
                <>
                    {children}
                    {showArrow && <ArrowRight className="h-5 w-5" />}
                </>
            )}
        </button>
    );
}
