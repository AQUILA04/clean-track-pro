
import { calculateOrderTotal, calculateDueDate } from './pricing.utils';
import { addHours, isSameHour } from 'date-fns';

describe('Pricing Utils', () => {
    const mockItems = [
        { price: 10, quantity: 1 },
        { price: 20, quantity: 2 }, // 40
    ]; // Total 50

    describe('calculateOrderTotal', () => {
        it('should return base total when not express', () => {
            const total = calculateOrderTotal(mockItems, false, {});
            expect(total).toBe(50);
        });

        it('should apply express multiplier when express is true', () => {
            const config = { express_multiplier: 1.5 };
            const total = calculateOrderTotal(mockItems, true, config);
            expect(total).toBe(75); // 50 * 1.5
        });

        it('should default multiplier to 1.0 if config missing', () => {
            const total = calculateOrderTotal(mockItems, true, {});
            expect(total).toBe(50);
        });

        it('should handle decimals correctly', () => {
            const items = [{ price: 10.55, quantity: 1 }];
            const config = { express_multiplier: 1.5 };
            // 10.55 * 1.5 = 15.825 -> 15.83 or 15.82? parseFloat(total.toFixed(2)) rounds 5 up usually
            const total = calculateOrderTotal(items, true, config);
            expect(total).toBe(15.83);
        });
    });

    describe('calculateDueDate', () => {
        it('should add standard SLA (48h) when not express', () => {
            const now = new Date('2023-01-01T10:00:00');
            const result = calculateDueDate(false, {}, now);
            const expected = addHours(now, 48);
            expect(result.toISOString()).toBe(expected.toISOString());
        });

        it('should add express SLA when express is true', () => {
            const now = new Date('2023-01-01T10:00:00');
            const config = { express_sla_hours: 24 };
            const result = calculateDueDate(true, config, now);
            const expected = addHours(now, 24);
            expect(result.toISOString()).toBe(expected.toISOString());
        });

        it('should default express SLA to 24h if config missing', () => {
            const now = new Date('2023-01-01T10:00:00');
            const result = calculateDueDate(true, {}, now); // Default 24
            const expected = addHours(now, 24);
            expect(result.toISOString()).toBe(expected.toISOString());
        });
    });
});
