import { IsOptional, IsString } from 'class-validator';

export class AcknowledgeRemittanceDto {
    @IsOptional()
    @IsString()
    notes?: string;
}
