import React from 'react';
import { Filter } from 'lucide-react';

export const AgencyFilters = () => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
                {/* Active Filter */}
                <button className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium shadow-sm shadow-blue-200">
                    Toutes les agences <span className="ml-1 opacity-80">24</span>
                </button>

                {/* Other Filters */}
                <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    Actives
                </button>

                <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Fermées
                </button>

                <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
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
