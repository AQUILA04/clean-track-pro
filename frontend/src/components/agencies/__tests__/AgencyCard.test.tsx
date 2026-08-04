import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgencyCard, Agency } from '@/components/agencies/AgencyCard';

const mockAgency: Agency = {
    id: 'agency-1',
    name: 'CleanTrack Paris',
    city: 'Paris',
    postalCode: '75001',
    status: 'ACTIVE',
    revenue: 1250,
    revenueTrend: 12,
    orders: 34,
    managers: [
        { name: 'Marie Dupont', initials: 'MD' },
        { name: 'Jean Martin', initials: 'JM' },
    ],
};

describe('AgencyCard', () => {
    it('[P1] renders agency name, location and metrics', () => {
        render(<AgencyCard agency={mockAgency} />);

        expect(screen.getByText('CleanTrack Paris')).toBeInTheDocument();
        expect(screen.getByText('Paris, 75001')).toBeInTheDocument();
        expect(screen.getByText('34')).toBeInTheDocument();
        expect(screen.getByText('+12%')).toBeInTheDocument();
    });

    it('[P1] displays active status badge', () => {
        render(<AgencyCard agency={mockAgency} />);

        expect(screen.getByText('ACTIF')).toBeInTheDocument();
    });

    it('[P1] renders manager avatars with initials', () => {
        render(<AgencyCard agency={mockAgency} />);

        expect(screen.getByText('MD')).toBeInTheDocument();
        expect(screen.getByText('JM')).toBeInTheDocument();
    });

    it('[P1] links to agency detail page', () => {
        render(<AgencyCard agency={mockAgency} />);

        const link = screen.getByRole('link', { name: /Voir détails/i });
        expect(link).toHaveAttribute('href', '/agencies/agency-1');
    });

    it('[P2] shows negative revenue trend in red', () => {
        render(
            <AgencyCard agency={{ ...mockAgency, revenueTrend: -5 }} />,
        );

        expect(screen.getByText('-5%')).toHaveClass('text-red-500');
    });
});
