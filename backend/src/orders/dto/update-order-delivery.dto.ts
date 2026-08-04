import {
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class UpdateOrderDeliveryDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    delivery_address?: string;

    @IsOptional()
    @IsString()
    @MaxLength(32)
    delivery_phone?: string;

    @IsOptional()
    @IsUUID()
    locality_id?: string;
}
