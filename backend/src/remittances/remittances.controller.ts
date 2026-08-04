import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { RemittancesService } from './remittances.service';
import { CreateCashRemittanceDto } from './dto/create-cash-remittance.dto';
import { CreateSiteRemittanceDto } from './dto/create-site-remittance.dto';
import { AcknowledgeRemittanceDto } from './dto/acknowledge-remittance.dto';
import { RemittanceStatus } from './enums/remittance-status.enum';

@Controller('remittances')
@UseGuards(AuthGuard, RoleGuard)
export class RemittancesController {
    constructor(private readonly remittancesService: RemittancesService) {}

    // --- Cash remittances (operator -> manager) ---

    @Post('cash')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site'] })
    async createCashRemittance(
        @Body() dto: CreateCashRemittanceDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const siteId = user.site_ids?.[0];
        if (!siteId) throw new BadRequestException('Site ID required');
        const isSiteAdmin = user.roles.some(
            (role) => role === 'Admin_Site' || role === 'realm:Admin_Site',
        );
        return this.remittancesService.createCashRemittance(
            dto,
            user.tenant_id,
            user.id,
            siteId,
            { autoAcknowledge: isSiteAdmin },
        );
    }

    @Patch('cash/:id/acknowledge')
    @Roles({ roles: ['realm:Admin_Site'] })
    async acknowledgeCashRemittance(
        @Param('id') id: string,
        @Body() dto: AcknowledgeRemittanceDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.remittancesService.acknowledgeCashRemittance(id, user.tenant_id, user.id, dto.notes);
    }

    @Patch('cash/:id/dispute')
    @Roles({ roles: ['realm:Admin_Site'] })
    async disputeCashRemittance(
        @Param('id') id: string,
        @Body() dto: AcknowledgeRemittanceDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.remittancesService.disputeCashRemittance(id, user.tenant_id, user.id, dto.notes);
    }

    @Get('cash')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant'] })
    async findCashRemittances(
        @CurrentUser() user: AuthUser,
        @Query('site_id') siteId?: string,
        @Query('status') status?: RemittanceStatus,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.remittancesService.findCashRemittances(user.tenant_id, siteId, status);
    }

    // --- Site remittances (manager -> tenant admin) ---

    @Post('site')
    @Roles({ roles: ['realm:Admin_Site'] })
    async createSiteRemittance(
        @Body() dto: CreateSiteRemittanceDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.remittancesService.createSiteRemittance(dto, user.tenant_id, user.id);
    }

    @Patch('site/:id/acknowledge')
    @Roles({ roles: ['realm:Admin_Tenant'] })
    async acknowledgeSiteRemittance(
        @Param('id') id: string,
        @Body() dto: AcknowledgeRemittanceDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.remittancesService.acknowledgeSiteRemittance(id, user.tenant_id, user.id, dto.notes);
    }

    @Patch('site/:id/dispute')
    @Roles({ roles: ['realm:Admin_Tenant'] })
    async disputeSiteRemittance(
        @Param('id') id: string,
        @Body() dto: AcknowledgeRemittanceDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.remittancesService.disputeSiteRemittance(id, user.tenant_id, user.id, dto.notes);
    }

    @Get('site')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant'] })
    async findSiteRemittances(
        @CurrentUser() user: AuthUser,
        @Query('site_id') siteId?: string,
        @Query('status') status?: RemittanceStatus,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.remittancesService.findSiteRemittances(user.tenant_id, siteId, status);
    }
}
