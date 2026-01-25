import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles, Public } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto';
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
    @Roles({ roles: ['Superadmin'] })
    create(
        @Body() createTenantDto: CreateTenantDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.tenantService.create(createTenantDto);
    }

    @Patch('me')
    @Roles({ roles: ['Admin_Tenant'] })
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
            .message('tenant.branding.updated')
            .data(updatedTenant)
            .build();
    }

    /**
     * AC3 Demonstration: Protected endpoint accessible by Admin_Tenant and Superadmin
     * Validates JWT token and extracts AuthUser context
     */
    @Get()
    @Roles({ roles: ['Admin_Tenant', 'Superadmin'] })
    findAll(@CurrentUser() user: AuthUser) {
        // Log user context to demonstrate AC3
        console.log('User context:', { id: user.id, roles: user.roles, tenant_id: user.tenant_id });
        return this.tenantService.findAll();
    }

    /**
     * AC4 Demonstration: User_Site attempting this route will get 403 Forbidden
     */
    @Get(':id')
    @Roles({ roles: ['Admin_Tenant', 'Superadmin'] })
    findOne(
        @Param('id') id: string,
        @CurrentUser() user: AuthUser,
    ) {
        // Demonstrate tenant_id extraction from JWT
        console.log('Finding tenant:', id, 'for user:', user.email, 'tenant_id:', user.tenant_id);
        return { id, message: 'Tenant details would be returned here', user: { email: user.email, roles: user.roles } };
    }

    /**
     * Public endpoint for testing - no authentication required
     */
    @Get('public/health')
    @Public()
    health() {
        return { status: 'ok', message: 'Tenant service is running' };
    }
}
