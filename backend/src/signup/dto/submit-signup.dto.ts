import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class SubmitSignupDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    organization_name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    agency_name: string;

    @IsEmail()
    admin_email: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    admin_first_name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    admin_last_name: string;

    @IsUUID()
    plan_id: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain must contain only lowercase alphanumeric characters and hyphens' })
    subdomain?: string;

    @IsOptional()
    @IsString()
    @IsIn(['MONTHLY', 'YEARLY'])
    billing_cycle?: 'MONTHLY' | 'YEARLY';
}
