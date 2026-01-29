import { Get, Query } from '@nestjs/common';
import { Controller, Post, Body, UseGuards, BadRequestException, Patch, Param } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
@UseGuards(AuthGuard, RoleGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to create order');
        }
        return this.ordersService.create(createOrderDto, user.tenant_id);
    }

    @Patch(':id/status')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    updateStatus(
        @Param('id') id: string,
        @Body() updateOrderStatusDto: UpdateOrderStatusDto,
        @CurrentUser() user: AuthUser
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to update order');
        }
        return this.ordersService.updateStatus(id, updateOrderStatusDto.status, user.tenant_id);
    }

    @Get('stats/dashboard')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Super_Admin'] })
    getDashboardStats(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to fetch dashboard stats');
        }
        return this.ordersService.getDashboardStats(user.tenant_id, timezone, startDate, endDate);
    }

    @Get()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    findAll(
        @CurrentUser() user: AuthUser,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('type') type: 'active' | 'all' = 'active'
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to fetch orders');
        }
        return this.ordersService.findAll(
            user.tenant_id,
            parseInt(page),
            parseInt(limit),
            type
        );
    }
}
