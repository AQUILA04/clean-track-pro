'use client';

import Link from 'next/link';

interface SignupButtonProps {
    variant?: 'default' | 'light';
    shortLabel?: boolean;
}

export function SignupButton({ variant = 'default', shortLabel = false }: SignupButtonProps) {
    const baseStyles =
        'inline-flex items-center rounded-xl px-8 py-4 text-base font-semibold transition-all';

    const variantStyles =
        variant === 'light'
            ? 'border-2 border-white bg-white text-[#1A5AD7] hover:bg-white/90 shadow-lg'
            : shortLabel
              ? 'border border-gray-200 bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm hover:bg-white hover:border-gray-300'
              : 'border-2 border-[#1A5AD7] bg-[#1A5AD7] text-white hover:bg-[#1548B0] shadow-md shadow-blue-900/20';

    return (
        <Link href="/signup" className={`${baseStyles} ${variantStyles}`}>
            {shortLabel ? 'Créer un compte' : 'Créer un compte pour gérer mon Pressing'}
        </Link>
    );
}
