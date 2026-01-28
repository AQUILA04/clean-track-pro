import React from 'react';
import { Table } from '../ui/table';
import { StorageSlot, StorageSlotStatus } from '../../services/storage.service';

interface StorageSlotListProps {
    slots: StorageSlot[];
    isLoading: boolean;
}

export const StorageSlotList: React.FC<StorageSlotListProps> = ({ slots, isLoading }) => {
    if (isLoading) {
        return <div className="text-center py-4">Loading slots...</div>;
    }

    const getStatusColor = (status: StorageSlotStatus) => {
        switch (status) {
            case StorageSlotStatus.FREE:
                return 'bg-green-100 text-green-800';
            case StorageSlotStatus.OCCUPIED:
                return 'bg-red-100 text-red-800';
            case StorageSlotStatus.RESERVED:
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' as keyof StorageSlot },
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
        <Table
            data={slots}
            columns={columns}
            keyExtractor={(slot) => slot.id}
            emptyMessage="No storage slots configured yet."
        />
    );
};
