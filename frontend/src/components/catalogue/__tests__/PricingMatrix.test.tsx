import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingMatrix } from '@/components/catalogue/PricingMatrix';
import { ArticleType } from '@/services/article-type.service';
import { LaundryService } from '@/components/catalogue/ServiceTable';
import { PricingEntry } from '@/types/pricing';

const mockArticles: ArticleType[] = [
    { id: 'art-1', name: 'Chemise', icon: 'Shirt', category: 'Vêtements' } as ArticleType,
];

const mockServices: LaundryService[] = [
    { id: 'svc-1', name: 'Lavage', description: '', icon: 'Droplets', color: 'text-blue-500' },
];

const mockPricing: PricingEntry[] = [
    { articleId: 'art-1', serviceId: 'svc-1', price: 5.5 },
];

describe('PricingMatrix', () => {
    const onPriceChange = jest.fn();
    const onSave = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[P1] renders pricing grid title and article count', () => {
        render(
            <PricingMatrix
                articles={mockArticles}
                services={mockServices}
                pricingData={mockPricing}
                onPriceChange={onPriceChange}
            />,
        );

        expect(screen.getByText('Grille Tarifaire')).toBeInTheDocument();
        expect(screen.getByText('Chemise')).toBeInTheDocument();
        expect(screen.getByText('Lavage')).toBeInTheDocument();
    });

    it('[P1] shows save button only when dirty', () => {
        const { rerender } = render(
            <PricingMatrix
                articles={mockArticles}
                services={mockServices}
                pricingData={mockPricing}
                isDirty={false}
                onSave={onSave}
                onPriceChange={onPriceChange}
            />,
        );

        expect(screen.queryByText('Enregistrer')).not.toBeInTheDocument();

        rerender(
            <PricingMatrix
                articles={mockArticles}
                services={mockServices}
                pricingData={mockPricing}
                isDirty={true}
                onSave={onSave}
                onPriceChange={onPriceChange}
            />,
        );

        expect(screen.getByText('Enregistrer')).toBeInTheDocument();
    });

    it('[P1] calls onSave when save button clicked', () => {
        render(
            <PricingMatrix
                articles={mockArticles}
                services={mockServices}
                pricingData={mockPricing}
                isDirty={true}
                onSave={onSave}
                onPriceChange={onPriceChange}
            />,
        );

        fireEvent.click(screen.getByText('Enregistrer'));
        expect(onSave).toHaveBeenCalledTimes(1);
    });
});
