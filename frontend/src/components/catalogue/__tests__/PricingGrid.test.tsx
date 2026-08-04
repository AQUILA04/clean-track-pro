import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingGrid } from '@/components/catalogue/PricingGrid';
import { ArticleType } from '@/services/article-type.service';
import { LaundryService } from '@/components/catalogue/ServiceTable';
import { PricingEntry } from '@/types/pricing';

const mockArticles: ArticleType[] = [
    { id: 'art-1', name: 'Chemise', icon: 'Shirt' } as ArticleType,
    { id: 'art-2', name: 'Pantalon', icon: 'Ticket' } as ArticleType,
];

const mockServices: LaundryService[] = [
    { id: 'svc-1', name: 'Lavage', description: '', icon: 'Droplets', color: 'text-blue-500' },
    { id: 'svc-2', name: 'Repassage', description: '', icon: 'Wind', color: 'text-green-500' },
];

const mockPricing: PricingEntry[] = [
    { articleId: 'art-1', serviceId: 'svc-1', price: 5.5 },
];

describe('PricingGrid', () => {
    const onPriceChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[P1] renders matrix with articles as rows and services as columns', () => {
        render(
            <PricingGrid
                articles={mockArticles}
                services={mockServices}
                initialPricing={mockPricing}
                onPriceChange={onPriceChange}
            />,
        );

        expect(screen.getByText('Chemise')).toBeInTheDocument();
        expect(screen.getByText('Pantalon')).toBeInTheDocument();
        expect(screen.getByText('Lavage')).toBeInTheDocument();
        expect(screen.getByText('Repassage')).toBeInTheDocument();
    });

    it('[P1] displays initial price values', () => {
        render(
            <PricingGrid
                articles={mockArticles}
                services={mockServices}
                initialPricing={mockPricing}
                onPriceChange={onPriceChange}
            />,
        );

        const priceInput = screen.getByDisplayValue('5.5');
        expect(priceInput).toBeInTheDocument();
    });

    it('[P1] calls onPriceChange when price is edited', () => {
        render(
            <PricingGrid
                articles={mockArticles}
                services={mockServices}
                initialPricing={mockPricing}
                onPriceChange={onPriceChange}
            />,
        );

        const priceInput = screen.getByDisplayValue('5.5');
        fireEvent.change(priceInput, { target: { value: '7.25' } });

        expect(onPriceChange).toHaveBeenCalledWith('art-1', 'svc-1', 7.25);
    });

    it('[P2] calls onPriceChange with null when cell is cleared', () => {
        render(
            <PricingGrid
                articles={mockArticles}
                services={mockServices}
                initialPricing={mockPricing}
                onPriceChange={onPriceChange}
            />,
        );

        const priceInput = screen.getByDisplayValue('5.5');
        fireEvent.change(priceInput, { target: { value: '' } });

        expect(onPriceChange).toHaveBeenCalledWith('art-1', 'svc-1', null);
    });
});
