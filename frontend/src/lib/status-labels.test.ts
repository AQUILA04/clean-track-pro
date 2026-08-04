import {
    formatStatusLabel,
    resolveDisplayOrderStatus,
} from '@/lib/status-labels';

describe('formatStatusLabel', () => {
    it('translates order statuses to French', () => {
        expect(formatStatusLabel('CREATED')).toBe('Créée');
        expect(formatStatusLabel('IN_PROGRESS')).toBe('En cours');
        expect(formatStatusLabel('READY')).toBe('Prête');
        expect(formatStatusLabel('LATE')).toBe('En retard');
    });

    it('translates payment statuses', () => {
        expect(formatStatusLabel('PAID', 'payment')).toBe('Payé');
        expect(formatStatusLabel('UNPAID', 'payment')).toBe('Impayé');
    });

    it('never returns raw empty status', () => {
        expect(formatStatusLabel(null)).toBe('—');
        expect(formatStatusLabel(undefined)).toBe('—');
    });
});

describe('resolveDisplayOrderStatus', () => {
    it('overrides with LATE when overdue', () => {
        expect(resolveDisplayOrderStatus('IN_PROGRESS', { isLate: true })).toBe('LATE');
        expect(resolveDisplayOrderStatus('DELIVERED', { isLate: true })).toBe('DELIVERED');
    });
});
