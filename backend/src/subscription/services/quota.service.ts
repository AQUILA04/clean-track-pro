import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Site } from '../../sites/entities/site.entity';
import { TenantSubscription } from '../entities/tenant-subscription.entity';
import { OperationKey } from '../enums/operation-key.enum';
import { EnforceLevel, SubscriptionStatus, UsagePeriod } from '../enums/usage-period.enum';
import { QuotaExceededException } from '../exceptions/quota-exceeded.exception';
import {
    OperationLimitConfig,
    PlanLimits,
    QuotaWindow,
    ResolvedWindowUsage,
} from '../types/plan-limits.types';
import { PeriodResolverService } from './period-resolver.service';
import { UsageService } from './usage.service';
import { isUnlimitedLimit } from '../utils/quota-limit.util';

const SUPERADMIN_ROLES = ['Superadmin', 'Super_Admin'];
const WRITES_BLOCKED_STATUSES = new Set([SubscriptionStatus.SUSPENDED, SubscriptionStatus.CANCELLED]);

@Injectable()
export class QuotaService {
    private readonly logger = new Logger(QuotaService.name);

    constructor(
        @InjectRepository(TenantSubscription)
        private readonly subscriptionRepository: Repository<TenantSubscription>,
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        @InjectRepository(Site)
        private readonly siteRepository: Repository<Site>,
        private readonly usageService: UsageService,
        private readonly periodResolver: PeriodResolverService,
    ) {}

    async assertWithinQuota(
        tenantId: string,
        operationKey: OperationKey | string,
        userRoles?: string[],
    ): Promise<void> {
        if (userRoles?.some((role) => SUPERADMIN_ROLES.includes(role))) {
            return;
        }

        const { limits, timezone, status, gracePeriodEndsAt } = await this.resolveSubscriptionContext(tenantId);
        this.assertSubscriptionAllowsWrites(status, gracePeriodEndsAt);

        const operationConfig = limits[operationKey];
        if (!operationConfig) {
            return;
        }

        if (operationConfig.type === 'capacity') {
            const projected = await this.getCapacityCount(tenantId, operationKey) + 1;
            this.assertCapacityWindows(operationKey, operationConfig, projected, timezone);
            return;
        }

        const windowUsages = await this.collectUsageWindowStatuses(tenantId, operationKey, operationConfig, timezone);
        const blockingWindow = windowUsages.find(
            (w) => !w.unlimited && w.enforce === EnforceLevel.HARD && w.limit !== null && w.current >= w.limit,
        );

        if (blockingWindow) {
            throw new QuotaExceededException({
                operation: operationKey,
                window: {
                    period: blockingWindow.period,
                    limit: blockingWindow.limit,
                    current: blockingWindow.current,
                    resetsAt: blockingWindow.periodEnd.toISOString(),
                },
                otherWindows: windowUsages
                    .filter((w) => w.period !== blockingWindow.period)
                    .map((w) => ({ period: w.period, current: w.current, limit: w.limit })),
            });
        }
    }

    async recordUsage(
        tenantId: string,
        operationKey: OperationKey | string,
        idempotencyKey?: string,
    ): Promise<void> {
        const { limits, timezone } = await this.resolveSubscriptionContext(tenantId);
        const operationConfig = limits[operationKey];
        if (!operationConfig || operationConfig.type !== 'usage') {
            return;
        }

        await this.usageService.incrementUsage(tenantId, operationKey, operationConfig, timezone, idempotencyKey);
    }

    async getTenantUsageSummary(tenantId: string): Promise<Record<string, ResolvedWindowUsage[]>> {
        const { limits, timezone } = await this.resolveSubscriptionContext(tenantId);
        const summary: Record<string, ResolvedWindowUsage[]> = {};

        for (const [operationKey, config] of Object.entries(limits)) {
            if (config.type === 'capacity') {
                const current = await this.getCapacityCount(tenantId, operationKey);
                summary[operationKey] = config.windows.map((window) => ({
                    period: window.period,
                    limit: isUnlimitedLimit(window.limit) ? null : window.limit,
                    unlimited: isUnlimitedLimit(window.limit),
                    current,
                    enforce: window.enforce,
                    periodKey: 'capacity',
                    periodStart: new Date(),
                    periodEnd: new Date(),
                    warnAt: window.warnAt,
                }));
                continue;
            }

            summary[operationKey] = await this.collectUsageWindowStatuses(tenantId, operationKey, config, timezone);
        }

        return summary;
    }

    private assertSubscriptionAllowsWrites(status: SubscriptionStatus, gracePeriodEndsAt: Date | null): void {
        if (WRITES_BLOCKED_STATUSES.has(status)) {
            throw new QuotaExceededException({
                operation: 'subscription',
                window: {
                    period: UsagePeriod.NONE,
                    limit: 0,
                    current: 0,
                    resetsAt: new Date().toISOString(),
                },
                otherWindows: [],
            });
        }

        if (status === SubscriptionStatus.PAST_DUE && gracePeriodEndsAt && new Date() > gracePeriodEndsAt) {
            throw new QuotaExceededException({
                operation: 'subscription',
                window: {
                    period: UsagePeriod.NONE,
                    limit: 0,
                    current: 0,
                    resetsAt: gracePeriodEndsAt.toISOString(),
                },
                otherWindows: [],
            });
        }
    }

    private assertCapacityWindows(
        operationKey: string,
        config: OperationLimitConfig,
        projectedCount: number,
        timezone: string,
    ): void {
        const windows = config.windows.filter((w) => w.enforce === EnforceLevel.HARD && !isUnlimitedLimit(w.limit));
        const exceeded = windows.find((w) => w.limit !== null && projectedCount > w.limit);
        if (!exceeded) {
            return;
        }

        throw new QuotaExceededException({
            operation: operationKey,
            window: {
                period: UsagePeriod.NONE,
                limit: exceeded.limit,
                current: projectedCount - 1,
                resetsAt: new Date().toISOString(),
            },
            otherWindows: windows.map((w) => ({
                period: w.period,
                current: projectedCount - 1,
                limit: w.limit,
            })),
        });
    }

    private async collectUsageWindowStatuses(
        tenantId: string,
        operationKey: string,
        config: OperationLimitConfig,
        timezone: string,
    ): Promise<ResolvedWindowUsage[]> {
        const now = new Date();
        const statuses: ResolvedWindowUsage[] = [];

        for (const window of config.windows) {
            if (window.period === UsagePeriod.NONE) {
                continue;
            }
            const bounds = this.periodResolver.resolve(window.period, now, timezone);
            if (!bounds) {
                continue;
            }
            const current = await this.usageService.getUsageCount(tenantId, operationKey, window.period, bounds);
            statuses.push({
                period: window.period,
                limit: isUnlimitedLimit(window.limit) ? null : window.limit,
                unlimited: isUnlimitedLimit(window.limit),
                current,
                enforce: window.enforce,
                periodKey: bounds.key,
                periodStart: bounds.start,
                periodEnd: bounds.end,
                warnAt: window.warnAt,
            });
        }

        return statuses;
    }

    private async getCapacityCount(tenantId: string, operationKey: string): Promise<number> {
        switch (operationKey) {
            case OperationKey.SITES_CAPACITY:
                return this.siteRepository.count({ where: { tenant_id: tenantId } });
            default:
                this.logger.warn(`No capacity counter registered for ${operationKey}`);
                return 0;
        }
    }

    private async resolveSubscriptionContext(tenantId: string): Promise<{
        limits: PlanLimits;
        timezone: string;
        status: SubscriptionStatus;
        gracePeriodEndsAt: Date | null;
    }> {
        const [tenant, subscription] = await Promise.all([
            this.tenantRepository.findOne({ where: { id: tenantId }, select: ['id', 'timezone'] }),
            this.subscriptionRepository.findOne({
                where: { tenant_id: tenantId },
                relations: ['plan'],
            }),
        ]);

        const timezone = tenant?.timezone ?? 'Europe/Paris';
        const planLimits = (subscription?.plan?.limits ?? {}) as PlanLimits;
        const customLimits = (subscription?.custom_limits ?? {}) as PlanLimits;
        const limits = this.mergeLimits(planLimits, customLimits);

        return {
            limits,
            timezone,
            status: subscription?.status ?? SubscriptionStatus.ACTIVE,
            gracePeriodEndsAt: subscription?.grace_period_ends_at ?? null,
        };
    }

    private mergeLimits(planLimits: PlanLimits, customLimits: PlanLimits): PlanLimits {
        const merged: PlanLimits = { ...planLimits };

        for (const [operationKey, customConfig] of Object.entries(customLimits)) {
            if (!merged[operationKey]) {
                merged[operationKey] = customConfig;
                continue;
            }

            merged[operationKey] = {
                ...merged[operationKey],
                ...customConfig,
                windows: this.mergeWindows(merged[operationKey].windows, customConfig.windows),
            };
        }

        return merged;
    }

    private mergeWindows(baseWindows: QuotaWindow[], overrideWindows: QuotaWindow[]): QuotaWindow[] {
        const byPeriod = new Map(baseWindows.map((w) => [w.period, w]));
        for (const override of overrideWindows) {
            byPeriod.set(override.period, { ...byPeriod.get(override.period), ...override });
        }
        return Array.from(byPeriod.values());
    }
}
