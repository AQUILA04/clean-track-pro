import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { getSignInPageUrl } from '@/lib/auth-urls';
import { DashboardShell } from '@/components/layout/DashboardShell';
import SessionProvider from '@/components/providers/SessionProvider';
import { ToastProvider } from '@/components/ui/simple-toast';
import { TenantConfigProvider } from '@/context/tenant-config.context';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect(getSignInPageUrl('/dashboard'));
    }

    return (
        <SessionProvider>
            <ToastProvider>
                <TenantConfigProvider>
                    <DashboardShell>{children}</DashboardShell>
                </TenantConfigProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
