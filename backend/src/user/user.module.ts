
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';
import { ConfigModule } from '@nestjs/config';
import { SiteModule } from '../sites/site.module';
import { Tenant } from '../tenant/entities/tenant.entity';

@Module({
    imports: [ConfigModule, KeycloakModule, SiteModule, TypeOrmModule.forFeature([Tenant])],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }
