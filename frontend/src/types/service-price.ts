import { ArticleType } from './article-type';
import { ServiceDefinition } from './service-definition';

export interface ServicePrice {
    id: string;
    tenant_id: string;
    article_type_id: string;
    service_definition_id: string;
    price: number | string; // API might return string for decimals, need to handle
    article_type?: ArticleType;
    service_definition?: ServiceDefinition;
    created_at: string;
    updated_at: string;
}

export interface UpsertServicePriceDto {
    article_type_id: string;
    service_definition_id: string;
    price: number;
}
