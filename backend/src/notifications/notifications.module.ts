import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformNotificationSettings } from './entities/platform-notification-settings.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { TenantModule } from '../tenant/tenant.module';
import { KeycloakModule } from '../shared/keycloak/keycloak.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PlatformNotificationSettings, NotificationLog]),
        TenantModule,
        KeycloakModule,
    ],
    controllers: [NotificationsController],
    providers: [NotificationService, EmailProvider, SmsProvider],
    exports: [NotificationService],
})
export class NotificationsModule {}
