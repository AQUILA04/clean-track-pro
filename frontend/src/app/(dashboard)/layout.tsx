import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { getSignInPageUrl } from '@/lib/auth-urls';
import { Sidebar } from '@/components/layout/Sidebar';
import { BrandMark } from '@/components/layout/BrandMark';
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
                    <div className="flex h-screen bg-background">
                        <Sidebar />

                        <div className="flex-1 flex flex-col md:ml-64 min-h-screen transition-all duration-300">
                            <header className="md:hidden h-16 bg-card border-b border-border flex items-center px-4">
                                <BrandMark compact />
                            </header>

                            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                                {children}
                            </main>
                        </div>
                    </div>
                </TenantConfigProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
