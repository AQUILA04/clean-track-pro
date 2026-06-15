export interface PricingEntry {
    articleId: string;
    serviceId: string;
    price: number | null;
    isFixed?: boolean;
}
