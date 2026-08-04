import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateCashRemittanceDto {
    @IsNotEmpty()
    @IsUUID()
    session_id: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    amount: number;
}
