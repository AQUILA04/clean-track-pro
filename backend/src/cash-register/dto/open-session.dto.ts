import { IsNumber, IsOptional, Min } from 'class-validator';

export class OpenSessionDto {
    @IsOptional()
    @IsNumber()
    @Min(0)
    opening_balance?: number;
}
