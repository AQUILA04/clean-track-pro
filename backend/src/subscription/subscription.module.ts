import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { TenantSubscription } from './entities/tenant-subscription.entity';
import { TenantUsagePeriod } from './entities/tenant-usage-period.entity';
import { SubscriptionController } from './controllers/subscription.controller';
import { SubscriptionPlanService } from './services/subscription-plan.service';
import { TenantSubscriptionService } from './services/tenant-subscription.service';
import { PeriodResolverService } from './services/period-resolver.service';
import { UsageService } from './services/usage.service';
import { QuotaService } from './services/quota.service';
import { Tenant } from '../tenant/entities/tenant.entity';
import { Site } from '../sites/entities/site.entity';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SubscriptionPlan,
            TenantSubscription,
            TenantUsagePeriod,
            Tenant,
            Site,
        ]),
        KeycloakModule,
    ],
    controllers: [SubscriptionController],
    providers: [
        SubscriptionPlanService,
        TenantSubscriptionService,
        PeriodResolverService,
        UsageService,
        QuotaService,
    ],
    exports: [QuotaService, TenantSubscriptionService, SubscriptionPlanService],
})
export class SubscriptionModule {}
