'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const error = searchParams.get('error');

    const handleSignIn = () => {
        signIn('keycloak', { callbackUrl });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">CleanTrack Pro</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to access your account
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-800">
                            Authentication failed. Please try again.
                        </p>
                    </div>
                )}

                <div className="mt-8">
                    <button
                        onClick={handleSignIn}
                        className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        Sign in with Keycloak
                    </button>
                </div>

                <p className="mt-4 text-center text-xs text-gray-500">
                    Secure authentication powered by Keycloak
                </p>
            </div>
        </div>
    );
}
