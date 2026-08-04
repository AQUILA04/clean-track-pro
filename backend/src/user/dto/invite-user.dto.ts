import { IsEmail, IsNotEmpty, IsString, IsOptional, ValidateIf, IsIn } from 'class-validator';

export class InviteUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['Admin_Tenant', 'Admin_Site', 'User_Site', 'Livreur'])
    role: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    /** Required for Admin_Site / User_Site / Livreur; not used for Admin_Tenant */
    @ValidateIf((o: InviteUserDto) => o.role === 'Admin_Site' || o.role === 'User_Site' || o.role === 'Livreur')
    @IsString()
    @IsNotEmpty()
    siteId?: string;

    /** Required when the inviter is Superadmin (no tenant in token) */
    @IsOptional()
    @IsString()
    tenantId?: string;
}
