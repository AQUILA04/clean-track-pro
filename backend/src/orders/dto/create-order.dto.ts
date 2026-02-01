import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsDateString, ValidateNested, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceLevel } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';

export class CreateOrderItemDto {
    @IsNotEmpty()
    @IsUUID()
    article_type_id: string;

    @IsNotEmpty()
    @IsUUID()
    service_definition_id: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    quantity: number;

    // Price is optional here as backend calculates it, but can be passed for verification
    @IsOptional()
    @IsNumber()
    price?: number;
}

export class CreateOrderDto {
    @IsNotEmpty()
    @IsUUID()
    site_id: string;

    @IsNotEmpty()
    @IsUUID()
    client_id: string;

    @IsOptional()
    @IsString()
    status?: OrderStatus;

    @IsOptional()
    @IsEnum(ServiceLevel)
    service_level?: ServiceLevel;

    @IsNotEmpty()
    @IsDateString()
    due_date: string; // ISO Date string

    @IsNotEmpty()
    @IsNumber()
    total_price: number;

    @IsNotEmpty()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}
