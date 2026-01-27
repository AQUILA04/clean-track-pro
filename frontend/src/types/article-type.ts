export interface ArticleType {
    id: string;
    tenant_id: string;
    label: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateArticleTypeDto {
    label: string;
    category: string;
    is_active?: boolean;
}

export interface UpdateArticleTypeDto extends Partial<CreateArticleTypeDto> { }
