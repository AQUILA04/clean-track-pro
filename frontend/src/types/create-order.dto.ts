export enum ServiceLevel {
    NORMAL = 'NORMAL',
    EXPRESS = 'EXPRESS'
}

export enum DeliveryMode {
    PICKUP = 'PICKUP',
    HOME_DELIVERY = 'HOME_DELIVERY',
}

export interface CreateOrderItemDto {
    article_type_id: string;
    service_definition_id: string;
    quantity: number;
    price?: number;
}

export enum PaymentMethod {
    CASH = 'CASH',
    MOBILE_MONEY = 'MOBILE_MONEY',
    CARD = 'CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface CreateOrderDto {
    site_id: string;
    client_id: string;
    service_level?: ServiceLevel;
    delivery_mode?: DeliveryMode;
    delivery_address?: string;
    delivery_phone?: string;
    locality_id?: string;
    due_date: string;
    total_price: number;
    items: CreateOrderItemDto[];
    initial_payment_amount?: number;
    initial_payment_method?: PaymentMethod;
    initial_payment_reference?: string;
}
