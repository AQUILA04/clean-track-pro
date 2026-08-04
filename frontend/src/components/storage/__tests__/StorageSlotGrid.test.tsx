import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StorageSlotGrid } from '@/components/storage/StorageSlotGrid';
import { StorageSlotStatus, SlotType } from '@/services/storage.service';

describe('StorageSlotGrid', () => {
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
            slot_type: SlotType.RECEPTION,
            site_id: 'site-1',
            tenant_id: 'tenant-1',
            created_at: '2023-01-02',
            updated_at: '2023-01-02',
        },
        {
            id: '3',
            name: 'B-01',
            status: StorageSlotStatus.OCCUPIED,
            slot_type: SlotType.DELIVERY,
            site_id: 'site-1',
            tenant_id: 'tenant-1',
            created_at: '2023-01-03',
            updated_at: '2023-01-03',
        },
    ];

    it('renders KPI counts', () => {
        render(
            <StorageSlotGrid slots={mockSlots} isLoading={false} onOccupiedClick={jest.fn()} />,
        );
        expect(screen.getByText('Total slots')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Slots libres')).toBeInTheDocument();
        expect(screen.getByText('Slots occupés')).toBeInTheDocument();
    });

    it('groups slots by rayon prefix', () => {
        render(
            <StorageSlotGrid slots={mockSlots} isLoading={false} onOccupiedClick={jest.fn()} />,
        );
        expect(screen.getByText('Rayon A')).toBeInTheDocument();
        expect(screen.getByText('Rayon B')).toBeInTheDocument();
    });

    it('calls onOccupiedClick only for occupied slots', () => {
        const onOccupiedClick = jest.fn();
        render(
            <StorageSlotGrid
                slots={mockSlots}
                isLoading={false}
                onOccupiedClick={onOccupiedClick}
            />,
        );

        fireEvent.click(screen.getByTitle(/A-01 — Libre/));
        expect(onOccupiedClick).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTitle(/A-02 — Occupé/));
        expect(onOccupiedClick).toHaveBeenCalledWith(
            expect.objectContaining({ id: '2', name: 'A-02' }),
        );
    });

    it('filters by zone chip', () => {
        render(
            <StorageSlotGrid slots={mockSlots} isLoading={false} onOccupiedClick={jest.fn()} />,
        );
        fireEvent.click(screen.getByRole('button', { name: /Livraison \(1\)/ }));
        expect(screen.queryByText('Rayon A')).not.toBeInTheDocument();
        expect(screen.getByText('Rayon B')).toBeInTheDocument();
    });
});
