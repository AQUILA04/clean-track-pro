import { Get, Query } from '@nestjs/common';
import { Controller, Post, Body, UseGuards, BadRequestException, Patch, Param } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderDeliveryDto } from './dto/update-order-delivery.dto';
import { OrderStatus } from './enums/order-status.enum';

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
        return this.ordersService.create(
            createOrderDto,
            user.tenant_id,
            user.id,
            user.site_ids?.[0],
            user.roles,
        );
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

    @Patch(':id/delivery')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Livreur'] })
    updateDelivery(
        @Param('id') id: string,
        @Body() dto: UpdateOrderDeliveryDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to update order');
        }
        return this.ordersService.updateDelivery(id, user.tenant_id, dto);
    }

    @Get('stats/dashboard')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin'] })
    getDashboardStats(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('siteId') siteId?: string,
        @Query('serviceId') serviceId?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to fetch dashboard stats');
        }
        return this.ordersService.getDashboardStats(
            user.tenant_id,
            timezone,
            startDate,
            endDate,
            siteId,
            serviceId,
        );
    }

    @Get('stats/weekly')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin', 'realm:User_Site'] })
    getWeeklyStats(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        return this.ordersService.getWeeklyStats(user.tenant_id, siteId);
    }

    @Get('stats/by-site')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin'] })
    getStatsBySite(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to fetch site stats');
        }
        return this.ordersService.getStatsBySite(
            user.tenant_id,
            timezone,
            startDate,
            endDate,
        );
    }

    @Get('stats/hourly')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin', 'realm:User_Site'] })
    getHourlyStats(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('siteId') siteId?: string,
        @Query('date') date?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        return this.ordersService.getHourlyStats(
            user.tenant_id,
            timezone,
            siteId,
            date,
        );
    }

    @Get('stats/delayed')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin', 'realm:User_Site'] })
    getDelayedStats(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        return this.ordersService.getDelayedStats(user.tenant_id, siteId);
    }

    @Get('stats/timeseries')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin'] })
    getTimeseriesStats(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('siteId') siteId?: string,
        @Query('serviceId') serviceId?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        if (!startDate || !endDate) {
            throw new BadRequestException('startDate and endDate are required');
        }
        return this.ordersService.getTimeseriesStats(
            user.tenant_id,
            timezone,
            startDate,
            endDate,
            siteId,
            serviceId,
        );
    }

    @Get('stats/throughput')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin'] })
    getThroughputStats(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('siteId') siteId?: string,
        @Query('serviceId') serviceId?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        return this.ordersService.getThroughputStats(
            user.tenant_id,
            timezone,
            startDate,
            endDate,
            siteId,
            serviceId,
        );
    }

    @Get('stats/by-service')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin'] })
    getStatsByService(
        @CurrentUser() user: AuthUser,
        @Query('timezone') timezone?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('siteId') siteId?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        return this.ordersService.getStatsByService(
            user.tenant_id,
            timezone,
            startDate,
            endDate,
            siteId,
        );
    }

    @Get()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    findAll(
        @CurrentUser() user: AuthUser,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '50',
        @Query('type') type: 'active' | 'all' = 'active',
        @Query('clientId') clientId?: string,
        @Query('status') status?: 'all' | 'ready' | 'processing' | 'late',
        @Query('q') q?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to fetch orders');
        }
        return this.ordersService.findAll(
            user.tenant_id,
            parseInt(page),
            parseInt(limit),
            type,
            clientId,
            { statusFilter: status, search: q },
        );
    }

    @Get('lookup')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Livreur'] })
    lookup(
        @CurrentUser() user: AuthUser,
        @Query('q') q: string,
        @Query('statuses') statuses?: string,
        @Query('siteId') siteId?: string,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to lookup orders');
        }
        if (!q?.trim()) {
            throw new BadRequestException('Query parameter q is required');
        }

        const statusList = statuses
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) as OrderStatus[] | undefined;

        return this.ordersService.lookup(q, user.tenant_id, {
            statuses: statusList,
            siteId: siteId || user.site_ids?.[0],
        });
    }

    @Get(':id')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant', 'realm:Livreur'] })
    findOne(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required to fetch order');
        }
        return this.ordersService.findOne(id, user.tenant_id);
    }
}
