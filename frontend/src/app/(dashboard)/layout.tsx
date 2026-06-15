import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Sidebar } from '@/components/layout/Sidebar';
import Link from 'next/link';
import SessionProvider from '@/components/providers/SessionProvider';
import { ToastProvider } from '@/components/ui/simple-toast';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/api/auth/signin');
    }

    return (
        <SessionProvider>
        <ToastProvider>
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md z-10">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-indigo-600">CleanTrack Pro</h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link href="/" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                        Dashboard
                    </Link>
                    <Link href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                        New Order
                    </Link>
                    <Link href="/orders/active" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                        Active Orders
                    </Link>
                    <Link href="/clients/new" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                        New Client
                    </Link>
                    <Link href="/storage" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                        Storage
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md">
                        Settings
                    </Link>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:ml-64 min-h-screen transition-all duration-300">
                {/* Mobile Header (Placeholder for future Mobile Nav) */}
                <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
                    <span className="font-bold text-lg text-primary">CleanTrack Pro</span>
                </header>

                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
        </ToastProvider>
        </SessionProvider>
    );
}

