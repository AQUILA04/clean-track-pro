import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site.entity';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { OperationKey } from '../subscription/enums/operation-key.enum';
import { QuotaService } from '../subscription/services/quota.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Site]),
        KeycloakModule,
        SubscriptionModule,
    ],
    controllers: [SiteController],
    providers: [SiteService],
    exports: [SiteService],
})
export class SiteModule { }
