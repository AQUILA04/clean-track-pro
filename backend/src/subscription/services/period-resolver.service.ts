import { Injectable } from '@nestjs/common';
import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { UsagePeriod } from '../enums/usage-period.enum';

export interface PeriodBounds {
    key: string;
    start: Date;
    end: Date;
}

@Injectable()
export class PeriodResolverService {
    resolve(period: UsagePeriod, now: Date, timezone: string): PeriodBounds | null {
        if (period === UsagePeriod.NONE) {
            return null;
        }

        const zoned = toZonedTime(now, timezone);

        switch (period) {
            case UsagePeriod.DAILY:
                return {
                    key: format(zoned, 'yyyy-MM-dd'),
                    start: fromZonedTime(startOfDay(zoned), timezone),
                    end: fromZonedTime(endOfDay(zoned), timezone),
                };
            case UsagePeriod.WEEKLY:
                return {
                    key: format(zoned, "yyyy-'W'II"),
                    start: fromZonedTime(startOfWeek(zoned, { weekStartsOn: 1 }), timezone),
                    end: fromZonedTime(endOfWeek(zoned, { weekStartsOn: 1 }), timezone),
                };
            case UsagePeriod.MONTHLY:
                return {
                    key: format(zoned, 'yyyy-MM'),
                    start: fromZonedTime(startOfMonth(zoned), timezone),
                    end: fromZonedTime(endOfMonth(zoned), timezone),
                };
            case UsagePeriod.YEARLY:
                return {
                    key: format(zoned, 'yyyy'),
                    start: fromZonedTime(startOfYear(zoned), timezone),
                    end: fromZonedTime(endOfYear(zoned), timezone),
                };
            default:
                return null;
        }
    }
}
