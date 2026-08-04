import { PeriodResolverService } from './period-resolver.service';
import { UsagePeriod } from '../enums/usage-period.enum';

describe('PeriodResolverService', () => {
    const service = new PeriodResolverService();

    it('resolves daily period in tenant timezone', () => {
        const now = new Date('2026-07-29T20:00:00.000Z');
        const bounds = service.resolve(UsagePeriod.DAILY, now, 'Indian/Reunion');

        expect(bounds?.key).toBe('2026-07-30');
    });

    it('resolves ISO weekly period key', () => {
        const now = new Date('2026-07-29T12:00:00.000Z');
        const bounds = service.resolve(UsagePeriod.WEEKLY, now, 'Europe/Paris');

        expect(bounds?.key).toMatch(/^\d{4}-W\d{2}$/);
    });

    it('returns null for capacity periods', () => {
        const bounds = service.resolve(UsagePeriod.NONE, new Date(), 'Europe/Paris');
        expect(bounds).toBeNull();
    });
});
