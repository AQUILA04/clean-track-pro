import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Response } from '../shared/response/response.builder';
import { TenancyGuard } from '../shared/guards/tenancy.guard';

@Controller('sites')
@UseGuards(AuthGuard, RoleGuard, TenancyGuard)
export class SiteController {
    constructor(private readonly siteService: SiteService) { }

    @Post()
    @Roles({ roles: ['realm:Admin_Tenant'] })
    async create(
        @Body() createSiteDto: CreateSiteDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing');
        }
        const site = await this.siteService.create(user.tenant_id, createSiteDto);
        return Response.builder()
            .status(HttpStatus.CREATED)
            .data(site)
            .build();
    }

    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site'] })
    async findAll(
        @CurrentUser() user: AuthUser,
        @Query('search') search?: string,
    ) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing');
        }
        const sites = await this.siteService.findAll(user.tenant_id, search);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(sites)
            .build();
    }

    @Get(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site'] })
    async findOne(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing');
        }
        const site = await this.siteService.findOne(id, user.tenant_id);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(site)
            .build();
    }

    @Patch(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    async update(
        @Param('id') id: string,
        @Body() updateSiteDto: any, // Using any for now, ideally UpdateSiteDto
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing');
        }

        // If user is Admin_Site, ensure they are updating their own site
        if (!user.roles.includes('Admin_Tenant') && !user.roles.includes('Superadmin')) {
            const userSiteIds = Array.isArray(user.site_ids) ? user.site_ids : (user.site_ids ? [user.site_ids] : []);
            if (!userSiteIds.includes(id)) {
                throw new Error('Access denied to update this site');
            }
        }

        const site = await this.siteService.update(id, user.tenant_id, updateSiteDto);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(site)
            .build();
    }
}
