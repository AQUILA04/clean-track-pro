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
import { ExpensesService } from './expenses.service';
import { CreateExpenseTypeDto, UpdateExpenseTypeDto } from './dto/expense-type.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
@UseGuards(AuthGuard, RoleGuard)
export class ExpensesController {
    constructor(private readonly expensesService: ExpensesService) {}

    // --- Types (Admin_Tenant + Admin_Site) ---

    @Get('types')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site'] })
    listTypes(
        @CurrentUser() user: AuthUser,
        @Query('activeOnly') activeOnly?: string,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const isAdmin = this.isTenantOrSiteAdmin(user);
        const onlyActive = activeOnly === 'true' || !isAdmin;
        return this.expensesService.listTypes(user.tenant_id, onlyActive);
    }

    @Post('types')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    createType(@Body() dto: CreateExpenseTypeDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.expensesService.createType(dto, user.tenant_id);
    }

    @Patch('types/:id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    updateType(
        @Param('id') id: string,
        @Body() dto: UpdateExpenseTypeDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.expensesService.updateType(id, dto, user.tenant_id);
    }

    @Delete('types/:id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    deactivateType(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.expensesService.deactivateType(id, user.tenant_id);
    }

    // --- Expenses ---

    @Get('stats/total')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site'] })
    getStats(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const scopedSiteId = this.resolveSiteScope(user, siteId);
        return this.expensesService.getStats(user.tenant_id, {
            siteId: scopedSiteId,
            startDate,
            endDate,
        });
    }

    @Get('stats/timeseries')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site'] })
    getTimeseries(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        if (!startDate || !endDate) {
            throw new BadRequestException('startDate and endDate are required');
        }
        const scopedSiteId = this.resolveSiteScope(user, siteId);
        return this.expensesService.getTimeseries(user.tenant_id, {
            siteId: scopedSiteId,
            startDate,
            endDate,
        });
    }

    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site'] })
    listExpenses(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('typeId') typeId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const scopedSiteId = this.resolveSiteScope(user, siteId);
        return this.expensesService.listExpenses(user.tenant_id, {
            siteId: scopedSiteId,
            startDate,
            endDate,
            typeId,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    @Post()
    @Roles({ roles: ['realm:User_Site', 'realm:Admin_Site'] })
    createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const sessionSiteId = user.site_ids?.[0];
        return this.expensesService.createExpense(dto, user.tenant_id, user.id, sessionSiteId);
    }

    @Delete(':id')
    @Roles({ roles: ['realm:Admin_Site', 'realm:Admin_Tenant'] })
    deleteExpense(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        const siteId = this.isTenantAdmin(user) ? undefined : user.site_ids?.[0];
        return this.expensesService.deleteExpense(id, user.tenant_id, siteId);
    }

    /** Admin_Tenant may filter any site; site roles are locked to their session site. */
    private resolveSiteScope(user: AuthUser, requestedSiteId?: string): string | undefined {
        if (this.isTenantAdmin(user)) return requestedSiteId;
        return user.site_ids?.[0];
    }

    private isTenantAdmin(user: AuthUser): boolean {
        return (user.roles || []).some((r) =>
            ['Admin_Tenant', 'Superadmin', 'Super_Admin'].includes(r.replace(/^realm:/, '')),
        );
    }

    private isTenantOrSiteAdmin(user: AuthUser): boolean {
        return (user.roles || []).some((r) =>
            ['Admin_Tenant', 'Admin_Site', 'Superadmin', 'Super_Admin'].includes(
                r.replace(/^realm:/, ''),
            ),
        );
    }
}
