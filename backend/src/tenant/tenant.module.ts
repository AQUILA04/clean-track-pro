import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { Tenant } from './entities/tenant.entity';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';
import { UserModule } from '../user/user.module';
import { SiteModule } from '../sites/site.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant]),
        KeycloakModule,
        UserModule,
        SiteModule,
        SubscriptionModule,
        ExpensesModule,
        CatalogModule,
    ],
    controllers: [TenantController],
    providers: [TenantService],
    exports: [TenantService],
})
export class TenantModule { }
