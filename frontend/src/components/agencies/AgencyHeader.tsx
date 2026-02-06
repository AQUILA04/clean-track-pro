import React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, OrderStatus } from '@/components/ui/Badge';

interface AgencyHeaderProps {
    name: string;
    city: string;
    postalCode: string;
    status: 'ACTIVE' | 'CLOSED' | 'MAINTENANCE' | 'INACTIVE';
    onEdit: () => void;
}

export const AgencyHeader: React.FC<AgencyHeaderProps> = ({ name, city, postalCode, status, onEdit }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                <div className="flex items-center gap-2 text-gray-500">
                    <span>{city}, {postalCode}</span>
                    <Badge status={status} className="ml-2" />
                </div>
            </div>

            <Button
                onClick={onEdit}
                className="bg-primary hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
                <Pencil className="mr-2 h-4 w-4" />
                Editer l'agence
            </Button>
        </div>
    );
};
