import Link from 'next/link';

type AuthErrorPanelProps = {
    message: string;
    onRetry: () => void;
    callbackUrl?: string;
};

export function AuthErrorPanel({ message, onRetry, callbackUrl = '/dashboard' }: AuthErrorPanelProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#F0F5FF] to-white px-4 py-10">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <h1 className="text-lg font-semibold text-gray-900">Connexion interrompue</h1>
                <p className="mt-3 text-sm text-gray-600" role="alert">
                    {message}
                </p>
                <button
                    type="button"
                    className="mt-6 w-full rounded-lg bg-[#1A5AD7] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1548b0]"
                    onClick={onRetry}
                >
                    Se reconnecter
                </button>
                <Link
                    href="/"
                    className="mt-4 inline-block text-sm text-[#1A5AD7] hover:underline"
                >
                    Retour à l&apos;accueil
                </Link>
                {callbackUrl !== '/dashboard' && (
                    <p className="mt-4 text-xs text-gray-400">
                        Destination après connexion : {callbackUrl}
                    </p>
                )}
            </div>
        </div>
    );
}
