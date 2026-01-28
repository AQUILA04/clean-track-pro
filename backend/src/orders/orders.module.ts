import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TenantModule } from '../tenant/tenant.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem]),
        TenantModule,
        CatalogModule
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService]
})
export class OrdersModule { }
