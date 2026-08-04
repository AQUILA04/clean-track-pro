import { StorageSlotStatus, SlotType } from '../entities/storage-slot.entity';
import { OrderStatus } from '../../orders/enums/order-status.enum';

export interface SlotContentsItemDto {
    id: string;
    quantity: number;
    price: number;
    article_label: string | null;
    service_label: string | null;
}

export interface SlotContentsOrderDto {
    id: string;
    reference: string | null;
    status: OrderStatus;
    client_name: string;
    client_phone: string | null;
    items: SlotContentsItemDto[];
}

export interface SlotContentsResponse {
    slot: {
        id: string;
        name: string;
        status: StorageSlotStatus;
        slot_type: SlotType;
    };
    order: SlotContentsOrderDto | null;
}
