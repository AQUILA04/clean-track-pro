import { OrderDto } from '../../orders/dto/order.dto';
import { SlotType } from '../entities/storage-slot.entity';

export interface OrderLookupResponse {
    order: OrderDto;
    slot_label: string | null;
    slot_type?: SlotType | null;
}
