import { formatOrderReference, getOrderPeriodKey, isFullUuid, isUuidPrefix, normalizeReferenceQuery } from './order-reference.util';

describe('order-reference.util', () => {
    it('formats REF-SS-YYMM-NNNNNN', () => {
        expect(formatOrderReference(1, new Date(2025, 6, 15), 136)).toBe('REF-01-2507-000136');
        expect(formatOrderReference(12, new Date(2026, 0, 1), 1)).toBe('REF-12-2601-000001');
    });

    it('builds period key YYMM', () => {
        expect(getOrderPeriodKey(new Date(2025, 6, 31))).toBe('2507');
    });

    it('detects full UUID and prefixes', () => {
        expect(isFullUuid('03d05cdb-457d-4e14-adb0-f174f985ec82')).toBe(true);
        expect(isUuidPrefix('03d05cdb')).toBe(true);
        expect(isUuidPrefix('ab')).toBe(false);
        expect(isUuidPrefix('136')).toBe(false);
        expect(isUuidPrefix('0136')).toBe(true);
    });

    it('normalizes reference queries', () => {
        expect(normalizeReferenceQuery('ref-01-2507-000136')).toBe('01-2507-000136');
        expect(normalizeReferenceQuery('  136  ')).toBe('136');
    });
});
