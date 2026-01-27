import { IsNumber, Min } from 'class-validator';

export class UpdateTenantConfigDto {
    @IsNumber()
    @Min(1.0)
    express_multiplier: number;

    @IsNumber()
    @Min(1)
    express_sla_hours: number;
}
