import { IsBoolean, IsEnum, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { BillingInterval } from '../enums/usage-period.enum';
import { PLATFORM_BILLING_CURRENCIES } from '../../fx/fx.constants';

export class CreateSubscriptionPlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    @IsIn([...PLATFORM_BILLING_CURRENCIES])
    currency?: string;

    @IsEnum(BillingInterval)
    billing_interval: BillingInterval;

    @IsOptional()
    @IsBoolean()
    is_public?: boolean;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsBoolean()
    is_free?: boolean;

    @IsOptional()
    @IsBoolean()
    auto_approve_signups?: boolean;

    @IsOptional()
    @IsString()
    stripe_price_id?: string;

    @IsObject()
    limits: Record<string, unknown>;

    @IsOptional()
    @IsObject()
    features?: Record<string, boolean>;
}
