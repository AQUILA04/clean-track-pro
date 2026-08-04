import React from 'react';
import { Filter } from 'lucide-react';

interface AgencyFiltersProps {
    currentFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    onFilterChange: (filter: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') => void;
    totalCount: number;
}

export const AgencyFilters: React.FC<AgencyFiltersProps> = ({ currentFilter, onFilterChange, totalCount }) => {
    const getButtonClass = (isActive: boolean) =>
        isActive
            ? 'px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium transition-all duration-150'
            : 'px-4 py-2 rounded-full bg-card border border-border text-muted-foreground text-sm font-medium hover:bg-muted/50 transition-colors duration-150 flex items-center gap-2';

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => onFilterChange('ALL')}
                    className={getButtonClass(currentFilter === 'ALL')}
                >
                    Toutes les agences{' '}
                    <span className={`ml-1 ${currentFilter === 'ALL' ? 'opacity-80' : 'text-muted-foreground'}`}>
                        {totalCount}
                    </span>
                </button>

                <button
                    onClick={() => onFilterChange('ACTIVE')}
                    className={getButtonClass(currentFilter === 'ACTIVE')}
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Actives
                </button>

                <button
                    onClick={() => onFilterChange('INACTIVE')}
                    className={getButtonClass(currentFilter === 'INACTIVE')}
                >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Fermées
                </button>

                <button
                    onClick={() => onFilterChange('MAINTENANCE')}
                    className={getButtonClass(currentFilter === 'MAINTENANCE')}
                >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    En maintenance
                </button>
            </div>

            <button className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors duration-150 flex items-center gap-2">
                <Filter size={14} />
                Filtres avancés
            </button>
        </div>
    );
};
