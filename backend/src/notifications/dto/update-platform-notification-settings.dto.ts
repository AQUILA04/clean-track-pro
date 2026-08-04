import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PLATFORM_BILLING_CURRENCIES } from '../../fx/fx.constants';

export class UpdatePlatformNotificationSettingsDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    sms_unit_price?: number | null;

    @IsOptional()
    @IsString()
    @IsIn([...PLATFORM_BILLING_CURRENCIES])
    currency?: string;
}
