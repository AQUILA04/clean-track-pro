import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSiteRemittanceDto {
    @IsNotEmpty()
    @IsUUID()
    site_id: string;

    @IsNotEmpty()
    @IsDateString()
    period_start: string;

    @IsNotEmpty()
    @IsDateString()
    period_end: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
