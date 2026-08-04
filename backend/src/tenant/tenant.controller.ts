import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles, Public } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto';
import { UpdateTenantConfigDto } from './dto/update-tenant-config.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Response } from '../shared/response/response.builder';
import { HttpStatus, Patch } from '@nestjs/common';

@Controller('tenants')
@UseGuards(AuthGuard, RoleGuard)
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

    /**
     * AC3 & AC4 Demonstration: Protected endpoint requiring Superadmin role
     * Returns 403 if user doesn't have Superadmin role
     */
    @Post()
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    create(
        @Body() createTenantDto: CreateTenantDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.tenantService.create(createTenantDto);
    }

    @Patch('me')
    @Roles({ roles: ['realm:Admin_Tenant'] })
    async updateBranding(
        @Body() updateTenantBrandingDto: UpdateTenantBrandingDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing for Admin_Tenant');
        }
        const updatedTenant = await this.tenantService.updateBranding(user.tenant_id, updateTenantBrandingDto);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(updatedTenant)
            .build();
    }

    @Patch('me/config')
    @Roles({ roles: ['realm:Admin_Tenant'] })
    async updateConfig(
        @Body() updateTenantConfigDto: UpdateTenantConfigDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing for Admin_Tenant');
        }
        const updatedTenant = await this.tenantService.updateConfig(user.tenant_id, updateTenantConfigDto);
        return Response.builder()
            .status(HttpStatus.OK)
            .message('tenant.config.updated')
            .data(updatedTenant)
            .build();
    }

    @Get('me')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site', 'realm:Livreur'] })
    async getMe(@CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing for user');
        }
        const tenant = await this.tenantService.findOne(user.tenant_id);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(tenant)
            .build();
    }

    /**
     * AC3 Demonstration: Protected endpoint accessible by Admin_Tenant and Superadmin
     * Validates JWT token and extracts AuthUser context
     */
    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin'] })
    findAll(@CurrentUser() user: AuthUser) {
        // Log user context to demonstrate AC3
        // console.log('User context:', { id: user.id, roles: user.roles, tenant_id: user.tenant_id });
        return this.tenantService.findAll();
    }

    /**
     * Public endpoint for testing - no authentication required
     */
    @Get('public/health')
    @Public()
    health() {
        return { status: 'ok', message: 'Tenant service is running' };
    }

    /**
     * AC4 Demonstration: User_Site attempting this route will get 403 Forbidden
     */
    @Get(':id')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async findOne(@Param('id') id: string) {
        const tenant = await this.tenantService.findOne(id);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(tenant)
            .build();
    }

    @Patch(':id')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async update(
        @Param('id') id: string,
        @Body() updateTenantDto: UpdateTenantDto,
    ) {
        const updatedTenant = await this.tenantService.update(id, updateTenantDto);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(updatedTenant)
            .build();
    }

    @Delete(':id')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    async remove(@Param('id') id: string) {
        await this.tenantService.remove(id);
        return Response.builder()
            .status(HttpStatus.OK)
            .message('tenant.deleted')
            .build();
    }
}
