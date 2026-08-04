import { OrderStatus } from '../enums/order-status.enum';
import { ServiceLevel } from '../entities/order.entity';

export class OrderDto {
    id: string;
    reference?: string | null;
    client_id: string;
    status: OrderStatus;
    service_level: ServiceLevel;
    due_date: Date;
    total_price: number;
    created_at: Date;
    updated_at: Date;
    items?: any[]; // Keep flexible or define OrderItemDto later
    client?: any; // For client details if joined
}
