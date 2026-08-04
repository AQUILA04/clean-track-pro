import { Controller, Post, Get, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
@UseGuards(AuthGuard, RoleGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site'] })
    async create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        const siteId = user.site_ids?.[0];
        if (!siteId) {
            throw new BadRequestException('Site ID required');
        }
        return this.paymentsService.create(dto, user.tenant_id, user.id, siteId);
    }

    @Get()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    async findByOrder(
        @Query('order_id') orderId: string,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        if (!orderId) {
            throw new BadRequestException('order_id query parameter is required');
        }
        return this.paymentsService.findByOrder(orderId, user.tenant_id);
    }
}
