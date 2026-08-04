import {
    Controller,
    Get,
    Patch,
    Body,
    Query,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { CurrentUser, type AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import { UpdatePlatformNotificationSettingsDto } from './dto/update-platform-notification-settings.dto';
import { UpdateTenantNotificationPrefsDto } from './dto/update-tenant-notification-prefs.dto';

@Controller('notifications')
@UseGuards(AuthGuard, RoleGuard)
export class NotificationsController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get('platform-settings')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin', 'realm:Admin_Tenant'] })
    getPlatformSettings() {
        return this.notificationService.getPlatformSettings();
    }

    @Patch('platform-settings')
    @Roles({ roles: ['realm:Superadmin', 'realm:Super_Admin'] })
    updatePlatformSettings(
        @Body() dto: UpdatePlatformNotificationSettingsDto,
        @CurrentUser() user: AuthUser,
    ) {
        return this.notificationService.updatePlatformSettings(dto, user.id);
    }

    @Get('tenant-config')
    @Roles({ roles: ['realm:Admin_Tenant'] })
    getTenantConfig(@CurrentUser() user: AuthUser) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.notificationService.getTenantNotificationConfig(user.tenant_id);
    }

    @Patch('tenant-config')
    @Roles({ roles: ['realm:Admin_Tenant'] })
    updateTenantConfig(
        @Body() dto: UpdateTenantNotificationPrefsDto,
        @CurrentUser() user: AuthUser,
    ) {
        if (!user.tenant_id) throw new BadRequestException('Tenant ID required');
        return this.notificationService.updateTenantNotificationPrefs(
            user.tenant_id,
            dto,
        );
    }

    @Get('logs')
    @Roles({ roles: ['realm:Admin_Tenant', 'realm:Superadmin', 'realm:Super_Admin'] })
    listLogs(
        @CurrentUser() user: AuthUser,
        @Query('limit') limit?: string,
    ) {
        if (!user.tenant_id && !user.roles?.some((r) => r.includes('Super'))) {
            throw new BadRequestException('Tenant ID required');
        }
        if (!user.tenant_id) {
            throw new BadRequestException('Tenant ID required for logs');
        }
        return this.notificationService.listLogs(
            user.tenant_id,
            limit ? parseInt(limit, 10) : 50,
        );
    }
}
