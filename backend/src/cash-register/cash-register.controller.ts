import { Controller, Post, Get, Body, Query, Param, UseGuards, BadRequestException, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import type { Response } from 'express';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { CashRegisterService } from './cash-register.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';

@Controller('cash-register')
@UseGuards(AuthGuard, RoleGuard)
export class CashRegisterController {
    constructor(private readonly cashRegisterService: CashRegisterService) {}

    @Post('open')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site'] })
    async open(@Body() dto: OpenSessionDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const siteId = user.site_ids?.[0];
        if (!siteId) throw new BadRequestException('Site ID required');
        return this.cashRegisterService.openSession(dto, user.tenant_id, user.id, siteId);
    }

    @Post('close')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site'] })
    async close(@Body() dto: CloseSessionDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.cashRegisterService.closeSession(dto, user.tenant_id, user.id);
    }

    @Get('current')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site'] })
    async current(@CurrentUser() user: AuthUser, @Res() res: Response) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const session = await this.cashRegisterService.getCurrentSession(user.tenant_id, user.id);
        // NestJS strips `null` into an empty body; emit JSON null explicitly for the client.
        return res.status(HttpStatus.OK).json(session);
    }

    @Get('sessions')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant'] })
    async sessions(
        @CurrentUser() user: AuthUser,
        @Query('site_id') siteId?: string,
        @Query('date') date?: string,
        @Query('operator_id') operatorId?: string,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.cashRegisterService.getSessions(user.tenant_id, siteId, date, operatorId);
    }

    @Get('sessions/:id/summary')
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site', 'realm:Admin_Tenant'] })
    async sessionSummary(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.cashRegisterService.getSessionSummary(id, user.tenant_id);
    }
}
