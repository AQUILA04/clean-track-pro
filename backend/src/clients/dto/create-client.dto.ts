import { IsString, IsNotEmpty, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    first_name: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber(undefined) // STRICT E.164 validation
    phone: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
