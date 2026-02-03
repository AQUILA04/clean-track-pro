import React from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface UserFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onFilterClick?: () => void;
    onExportClick?: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
    searchQuery,
    onSearchChange,
    onFilterClick,
    onExportClick
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Rechercher par nom, email ou agence..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    icon={<Filter className="h-4 w-4" />}
                    onClick={onFilterClick}
                >
                    Filtres
                </Button>
                <Button
                    variant="secondary"
                    icon={<Download className="h-4 w-4" />}
                    onClick={onExportClick}
                >
                    Exporter
                </Button>
            </div>
        </div>
    );
};
