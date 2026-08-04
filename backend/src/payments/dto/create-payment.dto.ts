import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentPhase } from '../enums/payment-phase.enum';

export class CreatePaymentDto {
    @IsNotEmpty()
    @IsUUID()
    order_id: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    amount: number;

    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    payment_method: PaymentMethod;

    @IsNotEmpty()
    @IsEnum(PaymentPhase)
    payment_phase: PaymentPhase;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
