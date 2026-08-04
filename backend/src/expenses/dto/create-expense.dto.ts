import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateExpenseDto {
    @IsNotEmpty()
    @IsUUID()
    expense_type_id: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    description: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsNotEmpty()
    @IsDateString()
    expense_date: string;

    @IsOptional()
    @IsString()
    receipt_url?: string;

    /** Admin_Tenant may target a site; site users use their session site. */
    @IsOptional()
    @IsString()
    site_id?: string;
}
