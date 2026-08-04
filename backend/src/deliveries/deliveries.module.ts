import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { StorageModule } from '../storage/storage.module';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order]),
        forwardRef(() => StorageModule),
        KeycloakModule,
    ],
    controllers: [DeliveriesController],
    providers: [DeliveriesService],
    exports: [DeliveriesService],
})
export class DeliveriesModule {}
