'use client';

import React, { useEffect, useId, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { BrandMark } from '@/components/layout/BrandMark';

type DashboardShellProps = {
    children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const titleId = useId();

    const closeMobileNav = () => setMobileNavOpen(false);
    const openMobileNav = () => setMobileNavOpen(true);

    useEffect(() => {
        if (!mobileNavOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeMobileNav();
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [mobileNavOpen]);

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />

            {/* Mobile drawer */}
            <div
                className={`fixed inset-0 z-[60] md:hidden ${mobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
                aria-hidden={!mobileNavOpen}
            >
                <button
                    type="button"
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
                        mobileNavOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-label="Fermer le menu"
                    tabIndex={mobileNavOpen ? 0 : -1}
                    onClick={closeMobileNav}
                />

                <aside
                    id="mobile-navigation"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className={`absolute inset-y-0 left-0 flex w-[min(100%,16rem)] flex-col bg-background border-r border-border shadow-xl transition-transform duration-200 ease-out ${
                        mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="flex items-center justify-between h-16 px-4 border-b border-border gap-2">
                        <div id={titleId} className="min-w-0 flex-1">
                            <BrandMark compact />
                        </div>
                        <button
                            type="button"
                            onClick={closeMobileNav}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                            aria-label="Fermer le menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <SidebarContent onNavigate={closeMobileNav} />
                </aside>
            </div>

            <div className="flex-1 flex flex-col md:ml-64 min-h-screen transition-all duration-300">
                <header className="md:hidden sticky top-0 z-40 h-16 bg-card border-b border-border flex items-center gap-2 px-3">
                    <button
                        type="button"
                        onClick={openMobileNav}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted/50 transition-colors"
                        aria-label="Ouvrir le menu"
                        aria-expanded={mobileNavOpen}
                        aria-controls="mobile-navigation"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <BrandMark compact />
                </header>

                <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
