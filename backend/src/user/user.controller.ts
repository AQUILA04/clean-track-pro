
import { Controller, Post, Get, Body, UseGuards, HttpStatus, Query } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { UserService } from './user.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Response } from '../shared/response/response.builder';

@Controller('users')
@UseGuards(AuthGuard, RoleGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @Roles({ roles: ['Admin_Tenant', 'Superadmin', 'Admin_Site', 'User_Site'] })
    async getUsers(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string
    ) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing');
        }

        // Access Control Logic
        const isAdmin = user.roles.includes('Admin_Tenant') || user.roles.includes('Superadmin');
        const isSiteUser = user.roles.includes('Admin_Site') || user.roles.includes('User_Site');

        if (!isAdmin) {
            // Non-admins must provide siteId and it must be one of their assigned sites
            if (!siteId) {
                throw new Error('Site ID required for non-admin users');
            }
            // Check if user has access to this site
            // Note: site_ids might come as string or array depending on token/mapper
            const userSiteIds: string[] = [];
            if (user.site_ids) {
                if (Array.isArray(user.site_ids)) {
                    userSiteIds.push(...user.site_ids);
                } else {
                    userSiteIds.push(user.site_ids);
                }
            }

            if (!userSiteIds.includes(siteId)) {
                throw new Error('Access to this site is denied');
            }
        }

        const users = await this.userService.getUsers(user.tenant_id, siteId);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(users)
            .build();
    }

    @Post('invite')
    @Roles({ roles: ['Admin_Tenant', 'Superadmin'] })
    async inviteUser(
        @Body() inviteUserDto: InviteUserDto,
        @CurrentUser() user: AuthUser,
    ) {
        // Enforce that Admin_Tenant can only invite to their own tenant
        const tenantId = user.tenant_id;
        if (!tenantId) {
            throw new Error('Tenant ID missing for Admin_Tenant');
        }

        const newUser = await this.userService.inviteUser(tenantId, inviteUserDto);

        return Response.builder()
            .status(HttpStatus.CREATED)
            .message('user.invited.success')
            .data(newUser)
            .build();
    }
}
