'use client';

import React from 'react';
import { LayoutGrid, Search, Table2, X, Zap } from 'lucide-react';

export type WorkflowViewMode = 'kanban' | 'table';

interface WorkflowFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    expressOnly: boolean;
    onExpressOnlyChange: (value: boolean) => void;
    viewMode: WorkflowViewMode;
    onViewModeChange: (mode: WorkflowViewMode) => void;
}

export function WorkflowFilters({
    search,
    onSearchChange,
    expressOnly,
    onExpressOnlyChange,
    viewMode,
    onViewModeChange,
}: WorkflowFiltersProps) {
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Rechercher N° commande ou nom client…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        aria-label="Rechercher une commande"
                    />
                </div>

                <div className="inline-flex rounded-xl border border-border bg-card p-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('table')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            viewMode === 'table'
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Table2 className="h-4 w-4" />
                        Tableau
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('kanban')}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            viewMode === 'kanban'
                                ? 'bg-primary text-white'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Kanban
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => onExpressOnlyChange(!expressOnly)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        expressOnly
                            ? 'bg-accent/20 text-accent border border-accent/40'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Zap className="h-3.5 w-3.5" />
                    Express
                    {expressOnly && <X className="h-3.5 w-3.5" />}
                </button>
                {expressOnly && (
                    <span className="text-xs text-muted-foreground">
                        Filtre actif : priorité Express
                    </span>
                )}
            </div>
        </div>
    );
}
