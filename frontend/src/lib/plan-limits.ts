export type UsagePeriod = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface QuotaWindow {
    period: UsagePeriod;
    limit: number | null;
    enforce: 'hard' | 'soft' | 'warn_only';
    warnAt?: number[];
}

export interface OperationLimitConfig {
    type: 'capacity' | 'usage';
    windows: QuotaWindow[];
}

export type PlanLimits = Record<string, OperationLimitConfig>;

export interface OperationRegistryEntry {
    key: string;
    label: string;
    description: string;
    type: 'capacity' | 'usage';
    periods: UsagePeriod[];
}

export const PERIOD_LABELS: Record<UsagePeriod, string> = {
    none: 'Capacité',
    daily: 'Journalier',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    yearly: 'Annuel',
};

export const OPERATION_REGISTRY: OperationRegistryEntry[] = [
    {
        key: 'orders.create',
        label: 'Commandes créées',
        description: 'Volume de commandes validées',
        type: 'usage',
        periods: ['daily', 'weekly', 'monthly'],
    },
    {
        key: 'sites.capacity',
        label: 'Sites / agences',
        description: 'Nombre maximum de sites',
        type: 'capacity',
        periods: ['none'],
    },
    {
        key: 'users.capacity',
        label: 'Utilisateurs',
        description: 'Nombre maximum d\'utilisateurs',
        type: 'capacity',
        periods: ['none'],
    },
    {
        key: 'storage_slots.capacity',
        label: 'Emplacements stockage',
        description: 'Nombre maximum de slots',
        type: 'capacity',
        periods: ['none'],
    },
];

export function isUnlimitedLimit(limit: number | null | undefined): boolean {
    return limit === null || limit === undefined || limit < 0;
}

export function parsePlanLimits(raw: Record<string, unknown> | undefined): PlanLimits {
    const limits: PlanLimits = {};

    for (const entry of OPERATION_REGISTRY) {
        const source = raw?.[entry.key] as OperationLimitConfig | undefined;
        limits[entry.key] = {
            type: entry.type,
            windows: entry.periods.map((period) => {
                const existing = source?.windows?.find((w) => w.period === period);
                const rawLimit = existing?.limit;
                const unlimited = isUnlimitedLimit(rawLimit);
                return {
                    period,
                    limit: unlimited ? null : Number(rawLimit),
                    enforce: existing?.enforce ?? 'hard',
                    warnAt: existing?.warnAt,
                };
            }),
        };
    }

    return limits;
}

export function serializePlanLimits(limits: PlanLimits): Record<string, OperationLimitConfig> {
    const output: Record<string, OperationLimitConfig> = {};

    for (const [key, config] of Object.entries(limits)) {
        output[key] = {
            type: config.type,
            windows: config.windows.map((window) => ({
                period: window.period,
                limit: isUnlimitedLimit(window.limit) ? null : window.limit,
                enforce: window.enforce,
                warnAt: window.warnAt,
            })),
        };
    }

    return output;
}
