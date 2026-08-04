import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { DeliveriesService } from './deliveries.service';

@Controller('deliveries')
@UseGuards(AuthGuard, RoleGuard)
export class DeliveriesController {
    constructor(private readonly deliveriesService: DeliveriesService) {}

    @Get('ready')
    @Roles({
        roles: [
            'realm:Livreur',
            'realm:Admin_Site',
            'realm:User_Site',
            'realm:Admin_Tenant',
        ],
    })
    listReady(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
        @Query('localityId') localityId?: string,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const resolvedSiteId = siteId || user.site_ids?.[0];
        this.assertSiteAccess(user, resolvedSiteId);
        return this.deliveriesService.listReady(
            user.tenant_id,
            resolvedSiteId,
            localityId,
        );
    }

    @Post(':orderId/confirm')
    @Roles({
        roles: ['realm:Livreur', 'realm:Admin_Site', 'realm:User_Site'],
    })
    confirm(
        @Param('orderId') orderId: string,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.deliveriesService.confirmDelivery(orderId, user.tenant_id);
    }

    private assertSiteAccess(user: AuthUser, siteId?: string) {
        if (!siteId) return;
        const isTenantAdmin =
            user.roles?.includes('Admin_Tenant') ||
            user.roles?.includes('Superadmin') ||
            user.roles?.includes('Super_Admin');
        if (isTenantAdmin) return;
        const siteIds = Array.isArray(user.site_ids)
            ? user.site_ids
            : user.site_ids
              ? [user.site_ids]
              : [];
        if (siteIds.length && !siteIds.includes(siteId)) {
            throw new BadRequestException('Access denied to this site');
        }
    }
}
