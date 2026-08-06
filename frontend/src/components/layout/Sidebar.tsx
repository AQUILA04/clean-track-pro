'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, UserCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { logout } from '@/lib/logout';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getVisibleNavItems } from '@/lib/navigation';
import { getSessionRoles, getRoleDisplayLabel } from '@/lib/roles';
import { BrandMark } from '@/components/layout/BrandMark';

type SidebarContentProps = {
    onNavigate?: () => void;
};

export const SidebarContent: React.FC<SidebarContentProps> = ({ onNavigate }) => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const roles = getSessionRoles(session?.user);
    const menuItems = getVisibleNavItems(roles);
    const primaryRole = roles[0];
    const roleLabel = primaryRole ? getRoleDisplayLabel(primaryRole) : null;

    const handleLogout = () => {
        logout();
    };

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
        if (href === '/orders') return pathname === '/orders';
        if (href === '/storage') return pathname === '/storage';
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group min-h-11 ${
                                active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                        >
                            <Icon
                                className={`mr-3 h-5 w-5 shrink-0 transition-colors ${
                                    active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                                }`}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                    <ThemeToggle />
                </div>

                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                        {session?.user?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                        ) : (
                            <UserCircle className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                            {session?.user?.name || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {roleLabel || session?.user?.email || ''}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center w-full px-2 py-2 min-h-11 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-150"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                </button>
            </div>
        </>
    );
};

export const Sidebar: React.FC = () => {
    return (
        <aside className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen fixed left-0 top-0 z-50 transition-colors duration-300">
            <div className="flex items-center h-16 px-6 border-b border-border">
                <BrandMark />
            </div>
            <SidebarContent />
        </aside>
    );
};
