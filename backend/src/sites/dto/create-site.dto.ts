
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSiteDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    postal_code?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;
}
