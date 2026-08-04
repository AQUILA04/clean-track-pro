import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsDateString, ValidateNested, ArrayMinSize, Min, MaxLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceLevel } from '../entities/order.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { DeliveryMode } from '../enums/delivery-mode.enum';
import { PaymentMethod } from '../../payments/enums/payment-method.enum';

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

    @IsOptional()
    @IsEnum(DeliveryMode)
    delivery_mode?: DeliveryMode;

    @ValidateIf((o: CreateOrderDto) => o.delivery_mode === DeliveryMode.HOME_DELIVERY)
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    delivery_address?: string;

    @ValidateIf((o: CreateOrderDto) => o.delivery_mode === DeliveryMode.HOME_DELIVERY)
    @IsNotEmpty()
    @IsString()
    @MaxLength(32)
    delivery_phone?: string;

    @ValidateIf((o: CreateOrderDto) => o.delivery_mode === DeliveryMode.HOME_DELIVERY)
    @IsNotEmpty()
    @IsUUID()
    locality_id?: string;

    @IsNotEmpty()
    @IsDateString()
    due_date: string;

    @IsNotEmpty()
    @IsNumber()
    total_price: number;

    @IsNotEmpty()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    initial_payment_amount?: number;

    @IsOptional()
    @IsEnum(PaymentMethod)
    initial_payment_method?: PaymentMethod;

    @IsOptional()
    @IsString()
    initial_payment_reference?: string;
}
