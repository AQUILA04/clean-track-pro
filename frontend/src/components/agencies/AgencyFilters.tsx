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
            ? "px-4 py-2 rounded-full bg-primary text-white text-sm font-medium shadow-sm shadow-blue-200"
            : "px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2";

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
                {/* All Agencies */}
                <button
                    onClick={() => onFilterChange('ALL')}
                    className={getButtonClass(currentFilter === 'ALL')}
                >
                    Toutes les agences <span className={`ml-1 ${currentFilter === 'ALL' ? 'opacity-80' : 'text-gray-500'}`}>{totalCount}</span>
                </button>

                {/* Active */}
                <button
                    onClick={() => onFilterChange('ACTIVE')}
                    className={getButtonClass(currentFilter === 'ACTIVE')}
                >
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    Actives
                </button>

                {/* Inactive (Fermées) */}
                <button
                    onClick={() => onFilterChange('INACTIVE')}
                    className={getButtonClass(currentFilter === 'INACTIVE')}
                >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Fermées
                </button>

                {/* Maintenance */}
                <button
                    onClick={() => onFilterChange('MAINTENANCE')}
                    className={getButtonClass(currentFilter === 'MAINTENANCE')}
                >
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    En maintenance
                </button>
            </div>

            {/* Advanced Filters Button */}
            <button className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition-colors flex items-center gap-2">
                <Filter size={14} />
                Filtres avancés
            </button>
        </div>
    );
};
