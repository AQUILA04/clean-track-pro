import { Controller, Post, Get, Patch, Delete, Body, UseGuards, HttpStatus, Query, BadRequestException, ForbiddenException, Param } from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { UserService } from './user.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { Response } from '../shared/response/response.builder';
import { TenancyGuard } from '../shared/guards/tenancy.guard';

@Controller('users')
@UseGuards(AuthGuard, RoleGuard, TenancyGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    private isSuperadmin(user: AuthUser): boolean {
        return user.roles.includes('Superadmin') || user.roles.includes('Super_Admin');
    }

    private isTenantAdmin(user: AuthUser): boolean {
        return user.roles.includes('Admin_Tenant');
    }

    @Get()
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin', 'realm:Admin_Site', 'realm:User_Site'] })
    async getUsers(
        @CurrentUser() user: AuthUser,
        @Query('siteId') siteId?: string,
        @Query('tenantId') tenantId?: string,
    ) {
        const isSuperadmin = this.isSuperadmin(user);
        const isAdmin = this.isTenantAdmin(user) || isSuperadmin;

        let targetTenantId: string | undefined;
        if (isSuperadmin) {
            targetTenantId = tenantId;
            if (!targetTenantId) {
                throw new BadRequestException('Tenant ID required for Superadmin');
            }
        } else {
            targetTenantId = user.tenant_id;
            if (!targetTenantId) {
                throw new BadRequestException('Tenant ID missing');
            }
        }

        if (!isAdmin) {
            if (!siteId) {
                throw new BadRequestException('Site ID required for non-admin users');
            }
            const userSiteIds: string[] = [];
            if (user.site_ids) {
                if (Array.isArray(user.site_ids)) {
                    userSiteIds.push(...user.site_ids);
                } else {
                    userSiteIds.push(user.site_ids);
                }
            }

            if (!userSiteIds.includes(siteId)) {
                throw new ForbiddenException('Access to this site is denied');
            }
        }

        const users = await this.userService.getUsers(targetTenantId, siteId);
        return Response.builder()
            .status(HttpStatus.OK)
            .data(users)
            .build();
    }

    @Post('invite')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async inviteUser(
        @Body() inviteUserDto: InviteUserDto,
        @CurrentUser() user: AuthUser,
    ) {
        const isSuperadmin = this.isSuperadmin(user);
        const isTenantAdmin = this.isTenantAdmin(user);

        let tenantId: string | undefined;

        if (isSuperadmin) {
            tenantId = inviteUserDto.tenantId;
            if (!tenantId) {
                throw new BadRequestException('Tenant ID required when inviting as Superadmin');
            }
            // Platform admin creates tenant admins (SA-06)
            if (inviteUserDto.role !== 'Admin_Tenant') {
                throw new ForbiddenException('Superadmin can only invite Admin_Tenant users');
            }
        } else if (isTenantAdmin) {
            tenantId = user.tenant_id;
            if (!tenantId) {
                throw new BadRequestException('Tenant ID missing for Admin_Tenant');
            }
            // Tenant admin cannot escalate to Admin_Tenant / Superadmin
            if (inviteUserDto.role !== 'Admin_Site' && inviteUserDto.role !== 'User_Site' && inviteUserDto.role !== 'Livreur') {
                throw new ForbiddenException('Admin_Tenant can only invite Admin_Site, User_Site or Livreur users');
            }
        } else {
            throw new ForbiddenException('Insufficient permissions to invite users');
        }

        const newUser = await this.userService.inviteUser(tenantId, inviteUserDto);

        return Response.builder()
            .status(HttpStatus.CREATED)
            .message('user.invited.success')
            .data(newUser)
            .build();
    }

    @Post(':id/resend-invitation')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async resendInvitation(
        @Param('id') userId: string,
        @CurrentUser() user: AuthUser,
        @Query('tenantId') tenantId?: string,
    ) {
        const isSuperadmin = this.isSuperadmin(user);
        const targetTenantId = isSuperadmin ? tenantId : user.tenant_id;

        if (!targetTenantId) {
            throw new BadRequestException('Tenant ID required to resend invitation');
        }

        const result = await this.userService.resendInvitation(targetTenantId, userId);
        return Response.builder()
            .status(HttpStatus.OK)
            .message('user.invitation.resent.success')
            .data(result)
            .build();
    }

    @Patch(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async updateUser(
        @Param('id') userId: string,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() user: AuthUser,
        @Query('tenantId') tenantId?: string,
    ) {
        const isSuperadmin = this.isSuperadmin(user);
        const targetTenantId = isSuperadmin ? tenantId : user.tenant_id;

        if (!targetTenantId) {
            throw new BadRequestException('Tenant ID required to update user');
        }

        if (isSuperadmin && updateUserDto.role && updateUserDto.role !== 'Admin_Tenant') {
            throw new ForbiddenException('Superadmin can only manage Admin_Tenant users');
        }

        if (!isSuperadmin && updateUserDto.role === 'Admin_Tenant') {
            throw new ForbiddenException('Admin_Tenant cannot assign Admin_Tenant role');
        }

        const updatedUser = await this.userService.updateUser(targetTenantId, userId, updateUserDto);
        return Response.builder()
            .status(HttpStatus.OK)
            .message('user.updated.success')
            .data(updatedUser)
            .build();
    }

    @Delete(':id')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin'] })
    async deleteUser(
        @Param('id') userId: string,
        @CurrentUser() user: AuthUser,
        @Query('tenantId') tenantId?: string,
    ) {
        const isSuperadmin = this.isSuperadmin(user);
        const targetTenantId = isSuperadmin ? tenantId : user.tenant_id;

        if (!targetTenantId) {
            throw new BadRequestException('Tenant ID required to delete user');
        }

        const result = await this.userService.deleteUser(targetTenantId, userId);
        return Response.builder()
            .status(HttpStatus.OK)
            .message('user.deleted.success')
            .data(result)
            .build();
    }
}
