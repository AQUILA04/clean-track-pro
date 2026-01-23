import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateTenantDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9-]+$/, { message: 'Subdomain must contain only alphanumeric characters and hyphens' })
    subdomain: string;
}
