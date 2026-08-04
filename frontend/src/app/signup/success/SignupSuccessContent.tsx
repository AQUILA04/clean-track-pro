'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { SignupService } from '@/services/signup.service';

export function SignupSuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(Boolean(sessionId));

    useEffect(() => {
        if (!sessionId) return;
        SignupService.completeCheckout(sessionId)
            .then((result) => setMessage(result.message))
            .catch((e) => setError(e instanceof Error ? e.message : 'Erreur de confirmation'))
            .finally(() => setLoading(false));
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F0F5FF] to-white flex items-center justify-center px-4 text-gray-900">
            <div className="max-w-md w-full p-8 text-center rounded-xl border border-gray-200 bg-white shadow-sm">
                {loading && (
                    <>
                        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1A5AD7]" />
                        <p className="mt-4 text-gray-600">Confirmation du paiement...</p>
                    </>
                )}
                {!loading && error && (
                    <>
                        <p className="text-red-600" role="alert">{error}</p>
                        <Link href="/signup" className="mt-4 block text-[#1A5AD7] hover:underline">
                            Réessayer
                        </Link>
                    </>
                )}
                {!loading && !error && (
                    <>
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                        <h1 className="text-xl font-semibold text-gray-900">Compte activé</h1>
                        <p className="mt-2 text-gray-600">
                            {message ?? 'Votre compte a été créé. Consultez votre email pour activer votre accès.'}
                        </p>
                        <Link href="/auth/signin" className="mt-6 inline-block text-[#1A5AD7] hover:underline">
                            Se connecter
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
