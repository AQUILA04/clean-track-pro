'use client';

import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getRoleDisplayLabel } from '@/lib/roles';

export type UserRoleFilter = 'all' | 'Admin_Tenant' | 'Admin_Site' | 'User_Site';
export type UserStatusFilter = 'all' | 'pending' | 'active';

interface UserFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onExportClick?: () => void;
    searchPlaceholder?: string;
    /** Legacy/simple mode — single filter action without role/status popover */
    onFilterClick?: () => void;
    /** User management mode — role & status popover */
    roleFilter?: UserRoleFilter;
    statusFilter?: UserStatusFilter;
    onRoleFilterChange?: (role: UserRoleFilter) => void;
    onStatusFilterChange?: (status: UserStatusFilter) => void;
    isSuperadmin?: boolean;
}

const selectClassName =
    'w-full rounded-lg border border-border bg-card py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

const primaryButtonClassName =
    'inline-flex items-center justify-center rounded-md font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary px-6 py-3.5 bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed';

export const UserFilters: React.FC<UserFiltersProps> = ({
    searchQuery,
    onSearchChange,
    onExportClick,
    searchPlaceholder = 'Rechercher par nom, email ou agence...',
    onFilterClick,
    roleFilter = 'all',
    statusFilter = 'all',
    onRoleFilterChange,
    onStatusFilterChange,
    isSuperadmin = false,
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const hasUserFilters = Boolean(onRoleFilterChange && onStatusFilterChange);
    const activeFilterCount =
        (roleFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

    const handleResetFilters = () => {
        onRoleFilterChange?.('all');
        onStatusFilterChange?.('all');
    };

    const showFilterButton = hasUserFilters || Boolean(onFilterClick);

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-border bg-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                {showFilterButton && (
                    hasUserFilters ? (
                        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <PopoverTrigger className={primaryButtonClassName}>
                                <Filter className="h-4 w-4 mr-2" />
                                Filtres
                                {activeFilterCount > 0 && (
                                    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-bold">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-72 bg-card border-border p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                            Rôle
                                        </label>
                                        <select
                                            className={selectClassName}
                                            value={roleFilter}
                                            onChange={(e) => onRoleFilterChange?.(e.target.value as UserRoleFilter)}
                                        >
                                            <option value="all">Tous les rôles</option>
                                    {isSuperadmin && <option value="Admin_Tenant">{getRoleDisplayLabel('Admin_Tenant')}</option>}
                                    {!isSuperadmin && (
                                        <>
                                            <option value="Admin_Site">{getRoleDisplayLabel('Admin_Site')}</option>
                                            <option value="User_Site">{getRoleDisplayLabel('User_Site')}</option>
                                        </>
                                    )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                            Statut
                                        </label>
                                        <select
                                            className={selectClassName}
                                            value={statusFilter}
                                            onChange={(e) => onStatusFilterChange?.(e.target.value as UserStatusFilter)}
                                        >
                                            <option value="all">Tous les statuts</option>
                                            <option value="pending">Invitation en attente</option>
                                            <option value="active">Compte configuré</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={handleResetFilters}
                                        >
                                            Réinitialiser
                                        </Button>
                                        <Button type="button" className="flex-1" onClick={() => setIsFilterOpen(false)}>
                                            Appliquer
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Button icon={<Filter className="h-4 w-4" />} onClick={onFilterClick}>
                            Filtres
                        </Button>
                    )
                )}
                {onExportClick && (
                    <Button icon={<Download className="h-4 w-4" />} onClick={onExportClick}>
                        Exporter
                    </Button>
                )}
            </div>
        </div>
    );
};
