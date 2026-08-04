import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { LocalitiesService } from './localities.service';
import { CreateLocalityDto, UpdateLocalityDto } from './dto/locality.dto';

@Controller('localities')
@UseGuards(AuthGuard, RoleGuard)
export class LocalitiesController {
    constructor(private readonly localitiesService: LocalitiesService) {}

    @Post()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    create(@Body() dto: CreateLocalityDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        this.assertSiteAccess(user, dto.site_id);
        return this.localitiesService.create(user.tenant_id, dto);
    }

    @Get()
    @Roles({
        roles: [
            'realm:Admin_Tenant',
            'realm:Admin_Site',
            'realm:User_Site',
            'realm:Livreur',
        ],
    })
    findAll(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const resolvedSiteId = siteId || user.site_ids?.[0];
        if (resolvedSiteId) this.assertSiteAccess(user, resolvedSiteId);
        return this.localitiesService.findAll(
            user.tenant_id,
            resolvedSiteId,
            activeOnly === 'true',
        );
    }

    @Get(':id')
    @Roles({
        roles: [
            'realm:Admin_Tenant',
            'realm:Admin_Site',
            'realm:User_Site',
            'realm:Livreur',
        ],
    })
    findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.localitiesService.findOne(id, user.tenant_id);
    }

    @Patch(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateLocalityDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const existing = await this.localitiesService.findOne(id, user.tenant_id);
        this.assertSiteAccess(user, existing.site_id);
        return this.localitiesService.update(id, user.tenant_id, dto);
    }

    @Delete(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    async deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const existing = await this.localitiesService.findOne(id, user.tenant_id);
        this.assertSiteAccess(user, existing.site_id);
        return this.localitiesService.deactivate(id, user.tenant_id);
    }

    private assertSiteAccess(user: AuthUser, siteId: string) {
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
        if (siteId && !siteIds.includes(siteId)) {
            throw new BadRequestException('Access denied to this site');
        }
    }
}
