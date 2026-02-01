import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site.entity';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Site]),
        KeycloakModule,
    ],
    controllers: [SiteController],
    providers: [SiteService],
    exports: [SiteService],
})
export class SiteModule { }
