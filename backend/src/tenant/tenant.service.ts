import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
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
}
