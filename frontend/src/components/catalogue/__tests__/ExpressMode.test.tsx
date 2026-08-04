import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpressMode } from '@/components/catalogue/ExpressMode';
import { formatCurrency } from '@/lib/format-currency';

const defaultData = {
    enabled: true,
    multiplier: '1.5',
    guaranteedDelivery: '24',
    currency: 'XOF',
    weightUnit: 'Kilogrammes (kg)',
    visibility: {
        showTTC: true,
        allowDiscounts: true,
        showInventory: false,
    },
};

describe('ExpressMode', () => {
    const onSave = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[P1] renders express mode configuration', () => {
        render(<ExpressMode initialData={defaultData} onSave={onSave} />);

        expect(screen.getByText('Configuration Mode Express')).toBeInTheDocument();
        expect(screen.getByText('Activé')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1.5')).toBeInTheDocument();
        expect(screen.getByDisplayValue('24')).toBeInTheDocument();
    });

    it('[P1] shows price preview based on multiplier', () => {
        render(<ExpressMode initialData={defaultData} onSave={onSave} />);

        const expected = formatCurrency(15, 'XOF');
        expect(
            screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === expected),
        ).toBeInTheDocument();
    });

    it('[P1] toggles enabled state via switch', () => {
        render(<ExpressMode initialData={defaultData} onSave={onSave} />);

        const toggle = screen.getByRole('switch');
        fireEvent.click(toggle);

        expect(screen.getByText('Désactivé')).toBeInTheDocument();
    });

    it('[P1] calls onSave with updated data on confirm', () => {
        render(<ExpressMode initialData={defaultData} onSave={onSave} />);

        const multiplierInput = screen.getByDisplayValue('1.5');
        fireEvent.change(multiplierInput, { target: { value: '2' } });

        fireEvent.click(screen.getByText('Confirmer & Sauvegarder'));

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({ multiplier: '2' }),
        );
    });

    it('[P2] toggles visibility option showInventory', () => {
        render(<ExpressMode initialData={defaultData} onSave={onSave} />);

        const option = screen.getByText("Afficher l'inventaire en temps réel");
        const checkbox = option.closest('label')?.querySelector('div');
        expect(checkbox).toBeTruthy();
        fireEvent.click(checkbox!);

        fireEvent.click(screen.getByText('Confirmer & Sauvegarder'));

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                visibility: expect.objectContaining({ showInventory: true }),
            }),
        );
    });
});
