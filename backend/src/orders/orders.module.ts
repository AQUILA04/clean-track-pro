import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TenantModule } from '../tenant/tenant.module';
import { CatalogModule } from '../catalog/catalog.module';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';
import { StorageModule } from '../storage/storage.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Client } from '../clients/entities/client.entity';
import { Site } from '../sites/entities/site.entity';
import { Locality } from '../localities/entities/locality.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, Client, Site, Locality]),
        TenantModule,
        CatalogModule,
        KeycloakModule,
        forwardRef(() => StorageModule),
        SubscriptionModule,
        NotificationsModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService]
})
export class OrdersModule { }
