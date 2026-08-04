import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Locality } from './entities/locality.entity';
import { Site } from '../sites/entities/site.entity';
import { LocalitiesService } from './localities.service';
import { LocalitiesController } from './localities.controller';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Locality, Site]),
        KeycloakModule,
    ],
    controllers: [LocalitiesController],
    providers: [LocalitiesService],
    exports: [LocalitiesService],
})
export class LocalitiesModule {}
