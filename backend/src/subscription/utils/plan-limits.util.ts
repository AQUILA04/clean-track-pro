import { BadRequestException } from '@nestjs/common';
import { OPERATION_REGISTRY } from '../constants/operation-registry';
import { EnforceLevel, UsagePeriod } from '../enums/usage-period.enum';
import { OperationLimitConfig, PlanLimits, QuotaWindow } from '../types/plan-limits.types';
import { isUnlimitedLimit, normalizeQuotaLimit } from '../utils/quota-limit.util';

export function normalizePlanLimits(raw: Record<string, unknown>): PlanLimits {
    const normalized: PlanLimits = {};

    for (const entry of OPERATION_REGISTRY) {
        const source = raw[entry.key] as OperationLimitConfig | undefined;
        if (!source) {
            continue;
        }

        const windows: QuotaWindow[] = entry.periods.map((period) => {
            const existing = source.windows?.find((w) => w.period === period);
            const limit = normalizeQuotaLimit(existing?.limit as number | null | undefined);
            return {
                period,
                limit,
                enforce: existing?.enforce ?? EnforceLevel.HARD,
                warnAt: existing?.warnAt,
            };
        });

        normalized[entry.key] = {
            type: entry.type,
            windows,
        };
    }

    return normalized;
}

export function validatePlanLimits(raw: Record<string, unknown>): PlanLimits {
    const limits = normalizePlanLimits(raw);

    for (const [operationKey, config] of Object.entries(raw)) {
        const known = OPERATION_REGISTRY.some((entry) => entry.key === operationKey);
        if (!known) {
            throw new BadRequestException(`Opération inconnue: ${operationKey}`);
        }

        const operationConfig = config as OperationLimitConfig;
        if (!operationConfig?.windows || !Array.isArray(operationConfig.windows)) {
            throw new BadRequestException(`Limites invalides pour ${operationKey}`);
        }

        for (const window of operationConfig.windows) {
            if (!Object.values(UsagePeriod).includes(window.period)) {
                throw new BadRequestException(`Période invalide pour ${operationKey}`);
            }
            if (!isUnlimitedLimit(window.limit) && (typeof window.limit !== 'number' || window.limit < 0)) {
                throw new BadRequestException(`Limite invalide pour ${operationKey} (${window.period})`);
            }
        }
    }

    return limits;
}
