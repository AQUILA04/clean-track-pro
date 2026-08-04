import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsIn(['Admin_Tenant', 'Admin_Site', 'User_Site', 'Livreur'])
    role?: string;

    @IsOptional()
    @IsString()
    siteId?: string;
}
