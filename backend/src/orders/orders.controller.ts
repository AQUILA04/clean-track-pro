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
    @Roles({ roles: ['User_Site', 'Admin_Site', 'Admin_Tenant'] })
    create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to create order');
        }
        return this.ordersService.create(createOrderDto, user.tenant_id);
    }

    @Patch(':id/status')
    @Roles({ roles: ['User_Site', 'Admin_Site', 'Admin_Tenant'] })
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
    @Roles({ roles: ['Admin_Site', 'Admin_Tenant', 'Superadmin'] })
    getDashboardStats(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('siteId') siteId?: string
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to fetch dashboard stats');
        }
        return this.ordersService.getDashboardStats(user.tenant_id, timezone, startDate, endDate, siteId);
    }

    @Get('stats/weekly')
    @Roles({ roles: ['Admin_Site', 'Admin_Tenant', 'Superadmin', 'User_Site'] })
    getWeeklyStats(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        return this.ordersService.getWeeklyStats(user.tenant_id, siteId);
    }

    @Get()
    @Roles({ roles: ['User_Site', 'Admin_Site', 'Admin_Tenant'] })
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
