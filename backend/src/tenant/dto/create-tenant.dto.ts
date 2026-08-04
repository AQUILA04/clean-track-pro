import { IsString, IsNotEmpty, Matches, IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMainAgencyDto } from './create-main-agency.dto';

export class CreateTenantDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9-]+$/, { message: 'Subdomain must contain only alphanumeric characters and hyphens' })
    subdomain: string;

    @IsEmail()
    @IsOptional()
    adminEmail?: string;

    @ValidateNested()
    @Type(() => CreateMainAgencyDto)
    mainAgency: CreateMainAgencyDto;
}
