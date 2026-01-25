
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class UpdateTenantBrandingDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsString()
    @IsUrl()
    @IsOptional()
    logoUrl?: string;
}
