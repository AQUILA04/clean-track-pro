import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    AuthGuard,
    KeycloakConnectModule,
    PolicyEnforcementMode,
    ResourceGuard,
    RoleGuard,
    TokenValidation,
} from 'nest-keycloak-connect';
import { KeycloakService } from './keycloak.service';
import { TenantActiveGuard } from '../guards/tenant-active.guard';
import { Tenant } from '../../tenant/entities/tenant.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant]),
        KeycloakConnectModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => {
                const authServerUrl = configService.get<string>('KEYCLOAK_AUTH_SERVER_URL');
                const realm = configService.get<string>('KEYCLOAK_REALM');
                const clientId = configService.get<string>('KEYCLOAK_CLIENT_ID');
                const secret = configService.get<string>('KEYCLOAK_CLIENT_SECRET');

                if (!authServerUrl || !realm || !clientId || !secret) {
                    throw new Error('Missing required Keycloak configuration');
                }

                return {
                    authServerUrl,
                    realm,
                    clientId,
                    secret,
                    policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
                    tokenValidation: TokenValidation.OFFLINE,
                    logLevels: ['verbose', 'debug', 'log', 'warn', 'error'],
                    useNestLogger: true,
                };
            },
            inject: [ConfigService],
        }),
    ],
    providers: [
        KeycloakService,
        // Order matters: AuthGuard must populate request.user before TenantActiveGuard.
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ResourceGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RoleGuard,
        },
        {
            provide: APP_GUARD,
            useClass: TenantActiveGuard,
        },
    ],
    exports: [KeycloakConnectModule, KeycloakService],
})
export class KeycloakModule { }
