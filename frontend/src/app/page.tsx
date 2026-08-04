import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { LandingPage } from '@/components/landing/LandingPage';
import { SignedOutHandler } from '@/components/landing/SignedOutHandler';

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ signedOut?: string }>;
}) {
    const { signedOut } = await searchParams;

    if (signedOut === '1') {
        return (
            <>
                <SignedOutHandler />
                <LandingPage />
            </>
        );
    }

    const session = await getServerSession(authOptions);

    if (session) {
        redirect('/dashboard');
    }

    return <LandingPage />;
}
