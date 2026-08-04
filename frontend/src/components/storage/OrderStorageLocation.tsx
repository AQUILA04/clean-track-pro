import React from 'react';
import { MapPin } from 'lucide-react';
import { SlotType } from '@/services/storage.service';

interface OrderStorageLocationProps {
    slotLabel: string | null | undefined;
    slotType?: SlotType | null;
    className?: string;
}

const slotTypeLabels: Record<SlotType, string> = {
    [SlotType.RECEPTION]: 'Réception',
    [SlotType.DELIVERY]: 'Livraison',
};

export const OrderStorageLocation: React.FC<OrderStorageLocationProps> = ({
    slotLabel,
    slotType,
    className = '',
}) => {
    return (
        <div
            className={`p-4 rounded-xl border-2 text-center ${
                slotLabel
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
            } ${className}`}
        >
            <div className="flex items-center justify-center gap-2 mb-1">
                <MapPin className={`h-4 w-4 ${slotLabel ? 'text-emerald-400' : 'text-amber-400'}`} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Emplacement
                    {slotType ? ` — ${slotTypeLabels[slotType]}` : ''}
                </p>
            </div>
            {slotLabel ? (
                <p className="text-3xl font-black text-emerald-400">{slotLabel}</p>
            ) : (
                <p className="text-lg font-medium text-amber-400">Non rangé</p>
            )}
        </div>
    );
};
