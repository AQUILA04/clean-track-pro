import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ServiceLevel, OrderStatus } from '../entities/order.entity';

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

    @IsNotEmpty() // Can be optional if backend calculates it, but initial draft implies frontend suggests it
    @IsDateString()
    due_date: string; // ISO Date string

    @IsNotEmpty()
    @IsNumber()
    total_price: number;

    // Items needed for calculation verification
    // For MVP/Story 4.2 focusing on Header/Price, we need items to verify price.
    // If not provided, we can't verify price accurately unless we assume trust or simple check.
    // As per Story 4.2 AC2 "Price Recalculation", price depends on items.
    // So we MUST accept items in DTO even if we don't save them in this specific simplified entity file yet
    // (though architecture.md mentions table order_items)
    // I'll add items locally to DTO for validation logic.
    @IsOptional()
    items?: { price: number; quantity: number }[];
}
