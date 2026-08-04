import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength, ValidateIf } from 'class-validator';

export class UpdateTenantBrandingDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    @MaxLength(200)
    name?: string;

    /** Absolute URL, or empty string / null to clear. */
    @ValidateIf((_, v) => v != null && v !== '')
    @IsUrl({ require_tld: false })
    @IsOptional()
    logoUrl?: string | null;

    @ValidateIf((_, v) => v != null && v !== '')
    @IsUrl({ require_tld: false })
    @IsOptional()
    faviconUrl?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    address?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(64)
    legal_id?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(64)
    vat_number?: string | null;
}
