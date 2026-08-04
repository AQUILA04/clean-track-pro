import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantUsagePeriod } from '../entities/tenant-usage-period.entity';
import { OperationKey } from '../enums/operation-key.enum';
import { UsagePeriod } from '../enums/usage-period.enum';
import { PeriodBounds, PeriodResolverService } from './period-resolver.service';
import { OperationLimitConfig } from '../types/plan-limits.types';

@Injectable()
export class UsageService {
    private readonly logger = new Logger(UsageService.name);

    constructor(
        @InjectRepository(TenantUsagePeriod)
        private readonly usageRepository: Repository<TenantUsagePeriod>,
        private readonly periodResolver: PeriodResolverService,
    ) {}

    async getUsageCount(
        tenantId: string,
        operationKey: string,
        period: UsagePeriod,
        bounds: PeriodBounds,
    ): Promise<number> {
        const row = await this.usageRepository.findOne({
            where: {
                tenant_id: tenantId,
                operation_key: operationKey,
                period_type: period,
                period_key: bounds.key,
            },
        });
        return row ? Number(row.count) : 0;
    }

    async incrementUsage(
        tenantId: string,
        operationKey: OperationKey | string,
        config: OperationLimitConfig,
        timezone: string,
        idempotencyKey?: string,
    ): Promise<void> {
        const now = new Date();
        const usageWindows = config.windows.filter((w) => w.period !== UsagePeriod.NONE);

        for (const window of usageWindows) {
            const bounds = this.periodResolver.resolve(window.period, now, timezone);
            if (!bounds) {
                continue;
            }

            if (idempotencyKey) {
                const existing = await this.usageRepository.findOne({
                    where: {
                        tenant_id: tenantId,
                        operation_key: `${operationKey}:idempotency:${idempotencyKey}:${window.period}:${bounds.key}`,
                        period_type: UsagePeriod.NONE,
                        period_key: 'event',
                    },
                });
                if (existing) {
                    this.logger.debug(`Skipping duplicate usage for ${operationKey} (${idempotencyKey})`);
                    continue;
                }
            }

            await this.usageRepository.query(
                `
                INSERT INTO tenant_usage_periods
                    (tenant_id, operation_key, period_type, period_key, period_start, period_end, count)
                VALUES ($1, $2, $3, $4, $5, $6, 1)
                ON CONFLICT (tenant_id, operation_key, period_type, period_key)
                DO UPDATE SET count = tenant_usage_periods.count + 1
                `,
                [tenantId, operationKey, window.period, bounds.key, bounds.start, bounds.end],
            );

            if (idempotencyKey) {
                await this.usageRepository.query(
                    `
                    INSERT INTO tenant_usage_periods
                        (tenant_id, operation_key, period_type, period_key, period_start, period_end, count)
                    VALUES ($1, $2, $3, $4, $5, $6, 1)
                    ON CONFLICT (tenant_id, operation_key, period_type, period_key) DO NOTHING
                    `,
                    [
                        tenantId,
                        `${operationKey}:idempotency:${idempotencyKey}:${window.period}:${bounds.key}`,
                        UsagePeriod.NONE,
                        'event',
                        bounds.start,
                        bounds.end,
                    ],
                );
            }
        }
    }

    async getUsageSnapshot(
        tenantId: string,
        operationKey: string,
        config: OperationLimitConfig,
        timezone: string,
    ): Promise<Array<{ period: UsagePeriod; current: number; limit: number | null; periodKey: string; periodEnd: Date }>> {
        const now = new Date();
        const results: Array<{ period: UsagePeriod; current: number; limit: number | null; periodKey: string; periodEnd: Date }> = [];

        for (const window of config.windows) {
            if (window.period === UsagePeriod.NONE) {
                continue;
            }
            const bounds = this.periodResolver.resolve(window.period, now, timezone);
            if (!bounds) {
                continue;
            }
            const current = await this.getUsageCount(tenantId, operationKey, window.period, bounds);
            results.push({
                period: window.period,
                current,
                limit: window.limit,
                periodKey: bounds.key,
                periodEnd: bounds.end,
            });
        }

        return results;
    }
}
