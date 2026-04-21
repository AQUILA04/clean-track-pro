import React from 'react';
import Link from 'next/link';
import SessionProvider from '@/components/providers/SessionProvider';
import { ToastProvider } from '@/components/ui/simple-toast';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
        </ToastProvider>
        </SessionProvider>
    );
}
