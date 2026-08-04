export interface ServiceDefinition {
    id: string;
    tenant_id: string;
    label: string;
    description?: string;
    is_active: boolean;
    is_system?: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateServiceDefinitionDto {
    label: string;
    description?: string;
    is_active?: boolean;
}

export type UpdateServiceDefinitionDto = Partial<CreateServiceDefinitionDto>;
