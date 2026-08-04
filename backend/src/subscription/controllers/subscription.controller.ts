import { Body, Controller, Get, HttpStatus, Param, Patch, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../../auth/decorators/current-user.decorator';
import { Response } from '../../shared/response/response.builder';
import { CreateSubscriptionPlanDto } from '../dto/create-subscription-plan.dto';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { QuotaService } from '../services/quota.service';
import { TenantSubscriptionService } from '../services/tenant-subscription.service';
import { UpdateSubscriptionPlanDto } from '../dto/update-subscription-plan.dto';
import { OPERATION_REGISTRY } from '../constants/operation-registry';

@Controller('subscriptions')
@UseGuards(AuthGuard, RoleGuard)
export class SubscriptionController {
    constructor(
        private readonly planService: SubscriptionPlanService,
        private readonly quotaService: QuotaService,
        private readonly tenantSubscriptionService: TenantSubscriptionService,
    ) {}

    @Get('plans')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async listPlans() {
        const plans = await this.planService.findAll();
        return Response.builder().status(HttpStatus.OK).data(plans).build();
    }

    @Post('plans')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async createPlan(@Body() dto: CreateSubscriptionPlanDto) {
        const plan = await this.planService.create(dto);
        return Response.builder().status(HttpStatus.CREATED).data(plan).build();
    }

    @Patch('plans/:id')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
        const plan = await this.planService.update(id, dto);
        return Response.builder().status(HttpStatus.OK).data(plan).build();
    }

    @Get('operations')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async listOperations() {
        return Response.builder().status(HttpStatus.OK).data(OPERATION_REGISTRY).build();
    }

    @Get('me')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site'] })
    async getMySubscription(@CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        const subscription = await this.tenantSubscriptionService.findByTenantId(user.tenant_id);
        return Response.builder().status(HttpStatus.OK).data(subscription).build();
    }

    @Get('me/usage')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    async getMyUsage(@CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required');
        }
        const usage = await this.quotaService.getTenantUsageSummary(user.tenant_id);
        return Response.builder().status(HttpStatus.OK).data(usage).build();
    }
}
