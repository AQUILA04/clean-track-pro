import React from 'react';
import { render, screen } from '@testing-library/react';
import { StorageSlotList } from '@/components/storage/StorageSlotList';
import { StorageSlotStatus } from '@/services/storage.service';

describe('StorageSlotList', () => {
    const mockSlots = [
        {
            id: '1',
            name: 'A-01',
            status: StorageSlotStatus.FREE,
            site_id: 'site-1',
            tenant_id: 'tenant-1',
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
        },
        {
            id: '2',
            name: 'A-02',
            status: StorageSlotStatus.OCCUPIED,
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

        // Verify first slot (FREE)
        const slot1Name = screen.getByText('A-01');
        const slot1Row = slot1Name.closest('tr');
        expect(slot1Row).toBeInTheDocument();

        const slot1Status = screen.getByText('FREE');
        expect(slot1Status).toBeInTheDocument();
        expect(slot1Status).toHaveClass('bg-green-100', 'text-green-800');

        // Verify second slot (OCCUPIED)
        const slot2Name = screen.getByText('A-02');
        const slot2Row = slot2Name.closest('tr');
        expect(slot2Row).toBeInTheDocument();

        const slot2Status = screen.getByText('OCCUPIED');
        expect(slot2Status).toBeInTheDocument();
        expect(slot2Status).toHaveClass('bg-red-100', 'text-red-800');
    });
});
