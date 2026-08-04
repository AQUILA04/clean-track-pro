import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTenantNotificationPrefsDto {
    @IsOptional()
    @IsBoolean()
    notification_email_enabled?: boolean;

    @IsOptional()
    @IsBoolean()
    notification_sms_enabled?: boolean;
}
