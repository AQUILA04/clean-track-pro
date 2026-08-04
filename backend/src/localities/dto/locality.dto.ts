import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLocalityDto {
    @IsUUID()
    site_id: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UpdateLocalityDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}
