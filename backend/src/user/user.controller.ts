
import { Controller, Post, Get, Body, UseGuards, HttpStatus } from '@nestjs/common';
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
    @Roles({ roles: ['Admin_Tenant', 'Superadmin'] })
    async getUsers(@CurrentUser() user: AuthUser) {
        if (!user.tenant_id) {
            throw new Error('Tenant ID missing');
        }
        const users = await this.userService.getUsers(user.tenant_id);
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
