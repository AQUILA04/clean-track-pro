'use client';

import { Tooltip } from '@/components/ui/Tooltip';

interface SignupPlaceholderButtonProps {
    variant?: 'default' | 'light';
}

export function SignupPlaceholderButton({ variant = 'default' }: SignupPlaceholderButtonProps) {
    const baseStyles =
        'inline-flex cursor-not-allowed items-center rounded-xl px-8 py-4 text-base font-semibold';

    const variantStyles =
        variant === 'light'
            ? 'border-2 border-white/60 bg-white/15 text-white opacity-70'
            : 'border-2 border-[#1A5AD7]/50 bg-[#F0F5FF] text-[#1548B0] shadow-md shadow-blue-900/10 opacity-75';

    return (
        <Tooltip label="Bientôt disponible — inscription en ligne prochainement">
            <button
                type="button"
                disabled
                aria-disabled="true"
                className={`${baseStyles} ${variantStyles}`}
            >
                Créer un compte pour gérer mon Pressing
            </button>
        </Tooltip>
    );
}
