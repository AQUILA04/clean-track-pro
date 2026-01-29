import { Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { SiteService } from './site.service';
import { Response } from '../shared/response/response.builder';

@Controller('sites')
@UseGuards(AuthGuard, RoleGuard)
export class SiteController {
    constructor(private readonly siteService: SiteService) { }

    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Admin_Site', 'realm:User_Site'] })
    async findAll(@CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing');
        }
        const sites = await this.siteService.findAll(user.tenant_id);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(sites)
            .build();
    }
}
