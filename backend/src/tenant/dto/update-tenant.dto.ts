import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTenantDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
