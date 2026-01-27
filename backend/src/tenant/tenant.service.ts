import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto';
import { UpdateTenantConfigDto } from './dto/update-tenant-config.dto';
import { Tenant } from './entities/tenant.entity';
import { KeycloakService } from '../shared/keycloak/keycloak.service';

@Injectable()
export class TenantService {
    private readonly logger = new Logger(TenantService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
        private keycloakService: KeycloakService,
    ) { }

    async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
        this.logger.log(`Creating new tenant: ${JSON.stringify(createTenantDto)}`);

        // Create Tenant in DB
        const newTenant = this.tenantRepository.create(createTenantDto);
        const savedTenant = await this.tenantRepository.save(newTenant);

        // Create Realm and Client in Keycloak
        try {
            await this.keycloakService.createRealm(savedTenant.subdomain);
            await this.keycloakService.createClient(savedTenant.subdomain, savedTenant.name);
        } catch (error) {
            this.logger.error(`Failed to configure Keycloak for tenant ${savedTenant.id}`, error);
            // Optional: Rollback DB transaction or mark tenant as failed configuration
        }

        return savedTenant;
    }

    async findAll(): Promise<Tenant[]> {
        return this.tenantRepository.find();
    }

    async updateBranding(id: string, updateTenantBrandingDto: UpdateTenantBrandingDto): Promise<Tenant> {
        this.logger.log(`Updating branding for tenant ${id}: ${JSON.stringify(updateTenantBrandingDto)}`);

        await this.tenantRepository.update(id, updateTenantBrandingDto);
        const updatedTenant = await this.tenantRepository.findOneBy({ id });

        if (!updatedTenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return updatedTenant;
    }

    async updateConfig(id: string, updateTenantConfigDto: UpdateTenantConfigDto): Promise<Tenant> {
        this.logger.log(`Updating config for tenant ${id}: ${JSON.stringify(updateTenantConfigDto)}`);

        await this.tenantRepository.update(id, updateTenantConfigDto);
        const updatedTenant = await this.tenantRepository.findOneBy({ id });

        if (!updatedTenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return updatedTenant;
    }
}
