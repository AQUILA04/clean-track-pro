import { OperationKey } from '../enums/operation-key.enum';
import { EnforceLevel, UsagePeriod } from '../enums/usage-period.enum';
import { PlanLimits } from '../types/plan-limits.types';

export const STARTER_LIMITS: PlanLimits = {
    [OperationKey.SITES_CAPACITY]: {
        type: 'capacity',
        windows: [{ period: UsagePeriod.NONE, limit: 1, enforce: EnforceLevel.HARD }],
    },
    [OperationKey.ORDERS_CREATE]: {
        type: 'usage',
        windows: [
            { period: UsagePeriod.DAILY, limit: 20, enforce: EnforceLevel.HARD, warnAt: [0.8] },
            { period: UsagePeriod.WEEKLY, limit: 100, enforce: EnforceLevel.HARD, warnAt: [0.8, 0.9] },
            { period: UsagePeriod.MONTHLY, limit: 500, enforce: EnforceLevel.HARD, warnAt: [0.8, 0.9] },
        ],
    },
    [OperationKey.USERS_CAPACITY]: {
        type: 'capacity',
        windows: [{ period: UsagePeriod.NONE, limit: 3, enforce: EnforceLevel.HARD }],
    },
    [OperationKey.STORAGE_SLOTS_CAPACITY]: {
        type: 'capacity',
        windows: [{ period: UsagePeriod.NONE, limit: 50, enforce: EnforceLevel.HARD }],
    },
};

export const PRO_LIMITS: PlanLimits = {
    [OperationKey.SITES_CAPACITY]: {
        type: 'capacity',
        windows: [{ period: UsagePeriod.NONE, limit: 5, enforce: EnforceLevel.HARD }],
    },
    [OperationKey.ORDERS_CREATE]: {
        type: 'usage',
        windows: [
            { period: UsagePeriod.DAILY, limit: 50, enforce: EnforceLevel.HARD, warnAt: [0.8] },
            { period: UsagePeriod.WEEKLY, limit: 500, enforce: EnforceLevel.HARD, warnAt: [0.8, 0.9] },
            { period: UsagePeriod.MONTHLY, limit: 2000, enforce: EnforceLevel.HARD, warnAt: [0.8, 0.9] },
        ],
    },
    [OperationKey.USERS_CAPACITY]: {
        type: 'capacity',
        windows: [{ period: UsagePeriod.NONE, limit: 15, enforce: EnforceLevel.HARD }],
    },
    [OperationKey.STORAGE_SLOTS_CAPACITY]: {
        type: 'capacity',
        windows: [{ period: UsagePeriod.NONE, limit: 200, enforce: EnforceLevel.HARD }],
    },
};
