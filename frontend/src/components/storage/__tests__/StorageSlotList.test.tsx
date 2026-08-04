import React from 'react';
import { render, screen } from '@testing-library/react';
import { StorageSlotList } from '@/components/storage/StorageSlotList';
import { StorageSlotStatus, SlotType } from '@/services/storage.service';

describe('StorageSlotList', () => {
    const mockSlots = [
        {
            id: '1',
            name: 'A-01',
            status: StorageSlotStatus.FREE,
            slot_type: SlotType.RECEPTION,
            site_id: 'site-1',
            tenant_id: 'tenant-1',
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
        },
        {
            id: '2',
            name: 'A-02',
            status: StorageSlotStatus.OCCUPIED,
            slot_type: SlotType.DELIVERY,
            site_id: 'site-1',
            tenant_id: 'tenant-1',
            created_at: '2023-01-02',
            updated_at: '2023-01-02',
        },
    ];

    it('renders loading state', () => {
        render(<StorageSlotList slots={[]} isLoading={true} />);
        expect(screen.getByText('Loading slots...')).toBeInTheDocument();
    });

    it('renders empty message when no slots', () => {
        render(<StorageSlotList slots={[]} isLoading={false} />);
        expect(screen.getByText('No storage slots configured yet.')).toBeInTheDocument();
    });

    it('renders list of slots with correct status styles', () => {
        render(<StorageSlotList slots={mockSlots} isLoading={false} />);

        expect(screen.getByText('A-01')).toBeInTheDocument();
        expect(screen.getByText('A-02')).toBeInTheDocument();

        const freeStatus = screen.getByText('FREE');
        expect(freeStatus).toHaveClass('bg-emerald-500/15');

        const occupiedStatus = screen.getByText('OCCUPIED');
        expect(occupiedStatus).toHaveClass('bg-muted');
    });
});
