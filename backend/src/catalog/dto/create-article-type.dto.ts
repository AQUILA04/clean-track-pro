import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateArticleTypeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    label: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    category: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    icon?: string;
}
