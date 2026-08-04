import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgencyFilters } from '@/components/agencies/AgencyFilters';

describe('AgencyFilters', () => {
    const onFilterChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[P1] renders all filter options with total count', () => {
        render(
            <AgencyFilters
                currentFilter="ALL"
                onFilterChange={onFilterChange}
                totalCount={12}
            />,
        );

        expect(screen.getByText(/Toutes les agences/)).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('Actives')).toBeInTheDocument();
        expect(screen.getByText('Fermées')).toBeInTheDocument();
        expect(screen.getByText('En maintenance')).toBeInTheDocument();
    });

    it('[P1] calls onFilterChange when active filter clicked', () => {
        render(
            <AgencyFilters
                currentFilter="ALL"
                onFilterChange={onFilterChange}
                totalCount={5}
            />,
        );

        fireEvent.click(screen.getByText('Actives'));
        expect(onFilterChange).toHaveBeenCalledWith('ACTIVE');
    });

    it('[P1] calls onFilterChange for maintenance filter', () => {
        render(
            <AgencyFilters
                currentFilter="ALL"
                onFilterChange={onFilterChange}
                totalCount={5}
            />,
        );

        fireEvent.click(screen.getByText('En maintenance'));
        expect(onFilterChange).toHaveBeenCalledWith('MAINTENANCE');
    });

    it('[P2] highlights current filter button', () => {
        render(
            <AgencyFilters
                currentFilter="ACTIVE"
                onFilterChange={onFilterChange}
                totalCount={5}
            />,
        );

        const activeButton = screen.getByText('Actives').closest('button');
        expect(activeButton).toHaveClass('bg-primary');
    });
});
