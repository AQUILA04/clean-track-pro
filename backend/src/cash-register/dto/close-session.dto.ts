import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseSessionDto {
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    declared_cash: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
