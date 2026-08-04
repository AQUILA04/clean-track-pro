import React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface AgencyHeaderProps {
    name: string;
    city: string;
    postalCode: string;
    status: 'ACTIVE' | 'CLOSED' | 'MAINTENANCE' | 'INACTIVE';
    onEdit: () => void;
}

export const AgencyHeader: React.FC<AgencyHeaderProps> = ({ name, city, postalCode, status, onEdit }) => {
    const locationParts = [city, postalCode].filter(Boolean);
    const locationLabel = locationParts.join(', ');

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                    {locationLabel && <span>{locationLabel}</span>}
                    <Badge status={status} className="ml-2" />
                </div>
            </div>

            <Button
                onClick={onEdit}
                className="bg-primary hover:bg-blue-600 text-white rounded-lg"
            >
                <Pencil className="mr-2 h-4 w-4" />
                Éditer l&apos;agence
            </Button>
        </div>
    );
};
