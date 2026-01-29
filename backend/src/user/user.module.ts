
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';
import { ConfigModule } from '@nestjs/config';
import { SiteModule } from '../sites/site.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
    imports: [ConfigModule, KeycloakModule, SiteModule, TenantModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule { }
