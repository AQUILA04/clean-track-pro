export enum ServiceLevel {
    NORMAL = 'NORMAL',
    EXPRESS = 'EXPRESS'
}

export interface CreateOrderItemDto {
    article_type_id: string;
    service_definition_id: string;
    quantity: number;
    price?: number;
}

export interface CreateOrderDto {
    site_id: string;
    client_id: string;
    service_level?: ServiceLevel;
    due_date: string; // ISO Date string
    total_price: number;
    items: CreateOrderItemDto[];
}
