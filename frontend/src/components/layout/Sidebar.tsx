'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Store,
    ShoppingBag,
    Users,
    BarChart3,
    Settings,
    LogOut,
    UserCircle
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Commandes', href: '/orders', icon: ShoppingBag },
    { name: 'Agences', href: '/agencies', icon: Store },
    { name: 'Catalogue', href: '/catalogue', icon: ShoppingBag },
    { name: 'Utilisateurs', href: '/users', icon: Users },
    { name: 'Rapports', href: '/reports', icon: BarChart3 },
    { name: 'Paramètres', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { data: session } = useSession();

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/api/auth/federated-logout' });
    };

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen fixed left-0 top-0 z-50 transition-colors duration-300">
            {/* Logo Section */}
            <div className="flex items-center h-16 px-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">C</span>
                    </div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                        CleanTrack <span className="text-primary">Pro</span>
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <Icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                }`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Profile Widget */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between mb-4">
                    <ThemeToggle />
                </div>

                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                        {session?.user?.image ? (
                            <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                        ) : (
                            <UserCircle className="h-6 w-6 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {session?.user?.name || 'Administrateur'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {session?.user?.email || 'admin@cleantrack.pro'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-2 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
};
