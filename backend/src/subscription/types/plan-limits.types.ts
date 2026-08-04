import { EnforceLevel, UsagePeriod } from '../enums/usage-period.enum';

export interface QuotaWindow {
    period: UsagePeriod;
    /** null = unlimited (no enforcement for this window) */
    limit: number | null;
    enforce: EnforceLevel;
    warnAt?: number[];
}

export interface OperationLimitConfig {
    type: 'capacity' | 'usage';
    windows: QuotaWindow[];
}

export type PlanLimits = Record<string, OperationLimitConfig>;

export interface ResolvedWindowUsage {
    period: UsagePeriod;
    limit: number | null;
    unlimited: boolean;
    current: number;
    enforce: EnforceLevel;
    periodKey: string;
    periodStart: Date;
    periodEnd: Date;
    warnAt?: number[];
}

export interface QuotaExceededDetails {
    operation: string;
    window: {
        period: UsagePeriod;
        limit: number | null;
        current: number;
        resetsAt: string;
    };
    otherWindows: Array<{
        period: UsagePeriod;
        current: number;
        limit: number | null;
    }>;
}
