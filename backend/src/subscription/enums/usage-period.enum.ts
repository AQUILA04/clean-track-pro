export enum UsagePeriod {
    NONE = 'none',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export enum EnforceLevel {
    HARD = 'hard',
    SOFT = 'soft',
    WARN_ONLY = 'warn_only',
}

export enum SubscriptionStatus {
    TRIAL = 'TRIAL',
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    SUSPENDED = 'SUSPENDED',
    CANCELLED = 'CANCELLED',
}

export enum BillingInterval {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
}
