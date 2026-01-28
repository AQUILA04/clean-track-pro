import { OrderStatus } from '../enums/order-status.enum';
import { ServiceLevel } from '../entities/order.entity';

export class OrderSummaryDto {
    id: string;
    client_name: string; // "First Last"
    items_summary: string; // "2 items" or "Shirt, Pants"
    due_date: Date;
    status: OrderStatus;
    total_price: number;
    service_level: ServiceLevel;
    created_at: Date;
}
