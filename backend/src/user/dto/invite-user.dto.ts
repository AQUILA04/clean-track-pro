
import { IsEmail, IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class InviteUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    role: string;

    @IsString()
    @IsNotEmpty()
    siteId: string;
}
