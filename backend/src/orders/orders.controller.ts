import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard, RoleGuard } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(AuthGuard, RoleGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID required to create order');
        }
        return this.ordersService.create(createOrderDto, user.tenant_id);
    }
}
