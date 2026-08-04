import React from 'react';
import { Table } from '../ui/table';
import { StorageSlot, StorageSlotStatus } from '../../services/storage.service';

interface StorageSlotListProps {
    slots: StorageSlot[];
    isLoading: boolean;
}

export const StorageSlotList: React.FC<StorageSlotListProps> = ({ slots, isLoading }) => {
    if (isLoading) {
        return <div className="text-center py-4 text-muted-foreground">Loading slots...</div>;
    }

    const getStatusColor = (status: StorageSlotStatus) => {
        switch (status) {
            case StorageSlotStatus.FREE:
                return 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400';
            case StorageSlotStatus.OCCUPIED:
                return 'bg-muted border border-border text-muted-foreground';
            case StorageSlotStatus.RESERVED:
                return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
            default:
                return 'bg-muted border border-border text-muted-foreground';
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' as keyof StorageSlot },
        {
            header: 'Type',
            accessor: (slot: StorageSlot) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    slot.slot_type === 'DELIVERY'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-purple-500/10 text-purple-400'
                }`}>
                    {slot.slot_type === 'DELIVERY' ? 'Livraison' : 'Réception'}
                </span>
            ),
        },
        {
            header: 'Status',
            accessor: (slot: StorageSlot) => (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(slot.status)}`}>
                    {slot.status}
                </span>
            )
        },
        { header: 'Site ID', accessor: 'site_id' as keyof StorageSlot },
        { header: 'Created At', accessor: (slot: StorageSlot) => new Date(slot.created_at).toLocaleDateString() },
    ];

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table
                data={slots}
                columns={columns}
                keyExtractor={(slot) => slot.id}
                emptyMessage="No storage slots configured yet."
            />
        </div>
    );
};
