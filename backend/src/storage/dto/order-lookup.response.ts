import { OrderDto } from '../../orders/dto/order.dto';

export interface OrderLookupResponse {
    order: OrderDto;
    slot_label: string | null;
}
