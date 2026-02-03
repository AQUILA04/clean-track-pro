export interface ArticleType {
    id: string;
    tenant_id: string;
    label: string;
    category: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    icon?: string;
}

export interface CreateArticleTypeDto {
    label: string;
    name?: string; // Alias for label for UI consistency
    articleId?: string;
    category: string;
    is_active?: boolean;
    icon?: string;
}

export type UpdateArticleTypeDto = Partial<CreateArticleTypeDto>;
