import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryFailedError } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantBrandingDto } from './dto/update-tenant-branding.dto';
import { UpdateTenantConfigDto } from './dto/update-tenant-config.dto';
import { Tenant } from './entities/tenant.entity';
import { normalizeCurrencyCode } from './constants/currencies';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { UserService } from '../user/user.service';
import { SiteService } from '../sites/site.service';
import { TenantSubscriptionService } from '../subscription/services/tenant-subscription.service';
import { BillingInterval } from '../subscription/enums/usage-period.enum';
import { ExpensesService } from '../expenses/expenses.service';
import { ServiceDefinitionService } from '../catalog/services/service-definition.service';

export interface CreateTenantOptions {
    adminFirstName?: string;
    adminLastName?: string;
    planId?: string;
    billingInterval?: BillingInterval;
}

@Injectable()
export class TenantService {
    private readonly logger = new Logger(TenantService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantRepository: Repository<Tenant>,
        private keycloakService: KeycloakService,
        private userService: UserService,
        private siteService: SiteService,
        private tenantSubscriptionService: TenantSubscriptionService,
        private expensesService: ExpensesService,
        private serviceDefinitionService: ServiceDefinitionService,
        private configService: ConfigService,
    ) { }

    async create(createTenantDto: CreateTenantDto, options?: CreateTenantOptions): Promise<Tenant> {
        const { adminEmail, mainAgency, ...tenantData } = createTenantDto;
        this.logger.log(`Creating new tenant: ${JSON.stringify(tenantData)}`);

        const newTenant = this.tenantRepository.create(tenantData);
        const savedTenant = await this.tenantRepository.save(newTenant);

        try {
            await this.keycloakService.createRealm(savedTenant.subdomain);
            await this.keycloakService.createClient(savedTenant.subdomain, savedTenant.name);
        } catch (error) {
            this.logger.error(`Failed to configure Keycloak for tenant ${savedTenant.id}`, error);
        }

        try {
            await this.siteService.createForTenantBootstrap(savedTenant.id, mainAgency);
            this.logger.log(`Main agency created for tenant ${savedTenant.id}: ${mainAgency.name}`);
        } catch (error) {
            this.logger.error(`Failed to create main agency for tenant ${savedTenant.id}`, error);
            throw error;
        }

        if (adminEmail) {
            try {
                await this.userService.inviteUser(savedTenant.id, {
                    email: adminEmail,
                    role: 'Admin_Tenant',
                    firstName: options?.adminFirstName ?? 'Admin',
                    lastName: options?.adminLastName ?? savedTenant.name,
                });
                this.logger.log(`Admin_Tenant invited for tenant ${savedTenant.id}: ${adminEmail}`);
            } catch (error) {
                this.logger.error(`Failed to invite admin for tenant ${savedTenant.id}`, error);
                this.logger.warn(
                    `Tenant ${savedTenant.id} created without admin invitation. You can retry invite for: ${adminEmail}`,
                );
            }
        }

        try {
            if (options?.planId) {
                await this.tenantSubscriptionService.assignPlan(
                    savedTenant.id,
                    options.planId,
                    options.billingInterval ?? BillingInterval.MONTHLY,
                );
            } else {
                await this.tenantSubscriptionService.assignDefaultPlan(savedTenant.id);
            }
        } catch (error) {
            this.logger.error(`Failed to assign subscription for tenant ${savedTenant.id}`, error);
        }

        try {
            await this.expensesService.ensureDefaultTypes(savedTenant.id);
        } catch (error) {
            this.logger.error(
                `Failed to seed default expense types for tenant ${savedTenant.id}`,
                error,
            );
        }

        try {
            await this.serviceDefinitionService.ensureDefaultServices(savedTenant.id);
        } catch (error) {
            this.logger.error(
                `Failed to seed default services for tenant ${savedTenant.id}`,
                error,
            );
        }

        return savedTenant;
    }

    async findAll(): Promise<Tenant[]> {
        return this.tenantRepository.find();
    }

    async updateBranding(id: string, updateTenantBrandingDto: UpdateTenantBrandingDto): Promise<Tenant> {
        this.logger.log(`Updating branding for tenant ${id}: ${JSON.stringify(updateTenantBrandingDto)}`);

        const payload: Partial<Tenant> = {};
        if (updateTenantBrandingDto.name !== undefined) {
            payload.name = updateTenantBrandingDto.name.trim();
        }
        if (updateTenantBrandingDto.logoUrl !== undefined) {
            payload.logoUrl = updateTenantBrandingDto.logoUrl?.trim() || null;
        }
        if (updateTenantBrandingDto.faviconUrl !== undefined) {
            payload.faviconUrl = updateTenantBrandingDto.faviconUrl?.trim() || null;
        }
        if (updateTenantBrandingDto.address !== undefined) {
            payload.address = updateTenantBrandingDto.address?.trim() || null;
        }
        if (updateTenantBrandingDto.legal_id !== undefined) {
            payload.legal_id = updateTenantBrandingDto.legal_id?.trim() || null;
        }
        if (updateTenantBrandingDto.vat_number !== undefined) {
            payload.vat_number = updateTenantBrandingDto.vat_number?.trim() || null;
        }

        await this.tenantRepository.update(id, payload);
        const updatedTenant = await this.tenantRepository.findOneBy({ id });

        if (!updatedTenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return updatedTenant;
    }

    async updateConfig(id: string, updateTenantConfigDto: UpdateTenantConfigDto): Promise<Tenant> {
        this.logger.log(`Updating config for tenant ${id}: ${JSON.stringify(updateTenantConfigDto)}`);

        const payload = {
            ...updateTenantConfigDto,
            currency: normalizeCurrencyCode(updateTenantConfigDto.currency),
        };
        await this.tenantRepository.update(id, payload);
        const updatedTenant = await this.tenantRepository.findOneBy({ id });

        if (!updatedTenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return this.withNormalizedCurrency(updatedTenant);
    }

    async updateNotificationPrefs(
        id: string,
        prefs: {
            notification_email_enabled?: boolean;
            notification_sms_enabled?: boolean;
        },
    ): Promise<Tenant> {
        const tenant = await this.findOne(id);
        if (prefs.notification_email_enabled !== undefined) {
            tenant.notification_email_enabled = prefs.notification_email_enabled;
        }
        if (prefs.notification_sms_enabled !== undefined) {
            tenant.notification_sms_enabled = prefs.notification_sms_enabled;
        }
        return this.tenantRepository.save(tenant);
    }

    async findOne(id: string): Promise<Tenant> {
        const tenant = await this.tenantRepository.findOneBy({ id });
        if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${id} not found`);
        }
        return this.withNormalizedCurrency(tenant);
    }

    private withNormalizedCurrency(tenant: Tenant): Tenant {
        tenant.currency = normalizeCurrencyCode(tenant.currency);
        return tenant;
    }

    async update(id: string, updateTenantDto: { name?: string; is_active?: boolean }): Promise<Tenant> {
        const tenant = await this.findOne(id);
        if (updateTenantDto.name !== undefined) {
            tenant.name = updateTenantDto.name;
        }
        if (updateTenantDto.is_active !== undefined) {
            tenant.is_active = updateTenantDto.is_active;
            this.logger.log(`Tenant ${id} ${updateTenantDto.is_active ? 'activated' : 'deactivated'}`);
        }
        const saved = await this.tenantRepository.save(tenant);

        if (updateTenantDto.is_active !== undefined) {
            try {
                await this.syncKeycloakUsersForActiveFlag(id, updateTenantDto.is_active);
            } catch (error) {
                this.logger.error(
                    `Tenant ${id} saved but Keycloak user sync failed`,
                    error,
                );
            }
        }

        return saved;
    }

    private async syncKeycloakUsersForActiveFlag(tenantId: string, isActive: boolean): Promise<void> {
        const realm = this.configService.get<string>('KEYCLOAK_REALM', 'cleantrack');
        await this.keycloakService.setTenantUsersEnabled(realm, tenantId, isActive);
    }

    async isTenantActive(tenantId: string): Promise<boolean> {
        const rows: Array<{ is_active: boolean }> = await this.tenantRepository.query(
            `SELECT is_active FROM tenants WHERE id = $1 LIMIT 1`,
            [tenantId],
        );
        return rows[0]?.is_active === true;
    }

    async remove(id: string): Promise<void> {
        const tenant = await this.findOne(id);
        try {
            await this.tenantRepository.remove(tenant);
        } catch (error) {
            if (error instanceof QueryFailedError) {
                throw new ConflictException(
                    'Impossible de supprimer ce tenant : des données associées existent encore.',
                );
            }
            throw error;
        }
    }
}
