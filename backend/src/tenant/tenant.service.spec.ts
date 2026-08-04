import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { TenantService } from './tenant.service';
import { Tenant } from './entities/tenant.entity';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { UserService } from '../user/user.service';
import { SiteService } from '../sites/site.service';
import { TenantSubscriptionService } from '../subscription/services/tenant-subscription.service';
import { ExpensesService } from '../expenses/expenses.service';
import { ServiceDefinitionService } from '../catalog/services/service-definition.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

describe('TenantService', () => {
    let service: TenantService;
    let mockRepository: any;
    let mockKeycloakService: any;
    let mockUserService: any;
    let mockSiteService: any;
    let mockExpensesService: { ensureDefaultTypes: jest.Mock };
    let mockServiceDefinitionService: { ensureDefaultServices: jest.Mock };

    beforeEach(async () => {
        mockRepository = {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((tenant) => Promise.resolve({
                id: 'generated-uuid',
                created_at: new Date(),
                ...tenant
            })),
            find: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            findOneBy: jest.fn().mockImplementation(({ id }) => Promise.resolve({
                id,
                name: 'Updated Name',
                logoUrl: 'http://example.com/logo.png',
                subdomain: 'test'
            })),
        };

        mockKeycloakService = {
            createRealm: jest.fn().mockResolvedValue(undefined),
            createClient: jest.fn().mockResolvedValue(undefined),
            setTenantUsersEnabled: jest.fn().mockResolvedValue(0),
        };

        mockUserService = {
            inviteUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
        };

        mockSiteService = {
            createForTenantBootstrap: jest.fn().mockResolvedValue({ id: 'site-1', name: 'Main Agency' }),
        };

        const mockTenantSubscriptionService = {
            assignPlan: jest.fn(),
            assignDefaultPlan: jest.fn().mockResolvedValue({}),
        };

        mockExpensesService = {
            ensureDefaultTypes: jest.fn().mockResolvedValue(undefined),
        };

        mockServiceDefinitionService = {
            ensureDefaultServices: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantService,
                {
                    provide: getRepositoryToken(Tenant),
                    useValue: mockRepository,
                },
                {
                    provide: KeycloakService,
                    useValue: mockKeycloakService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: SiteService,
                    useValue: mockSiteService,
                },
                {
                    provide: TenantSubscriptionService,
                    useValue: mockTenantSubscriptionService,
                },
                {
                    provide: ExpensesService,
                    useValue: mockExpensesService,
                },
                {
                    provide: ServiceDefinitionService,
                    useValue: mockServiceDefinitionService,
                },
                {
                    provide: ConfigService,
                    useValue: { get: jest.fn().mockReturnValue('cleantrack') },
                },
            ],
        }).compile();

        service = module.get<TenantService>(TenantService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a tenant and configure Keycloak', async () => {
        const dto: CreateTenantDto = {
            name: 'Test Agency',
            subdomain: 'test-agency',
            mainAgency: { name: 'Agence Principale' },
        };

        const result = await service.create(dto);

        expect(result).toBeDefined();
        expect(result.id).toEqual('generated-uuid');
        expect(mockRepository.create).toHaveBeenCalledWith({
            name: dto.name,
            subdomain: dto.subdomain,
        });
        expect(mockRepository.save).toHaveBeenCalled();
        expect(mockKeycloakService.createRealm).toHaveBeenCalledWith(dto.subdomain);
        expect(mockKeycloakService.createClient).toHaveBeenCalledWith(dto.subdomain, dto.name);
        expect(mockSiteService.createForTenantBootstrap).toHaveBeenCalledWith(
            'generated-uuid',
            dto.mainAgency,
        );
        expect(mockExpensesService.ensureDefaultTypes).toHaveBeenCalledWith('generated-uuid');
        expect(mockServiceDefinitionService.ensureDefaultServices).toHaveBeenCalledWith(
            'generated-uuid',
        );
    });

    it('should invite Admin_Tenant when adminEmail is provided', async () => {
        const dto: CreateTenantDto = {
            name: 'Test Agency',
            subdomain: 'test-agency',
            adminEmail: 'admin@test.com',
            mainAgency: { name: 'Agence Principale' },
        };

        await service.create(dto);

        expect(mockUserService.inviteUser).toHaveBeenCalledWith('generated-uuid', {
            email: 'admin@test.com',
            role: 'Admin_Tenant',
            firstName: 'Admin',
            lastName: 'Test Agency',
        });
    });

    it('should not invite admin when adminEmail is omitted', async () => {
        const dto: CreateTenantDto = {
            name: 'Test Agency',
            subdomain: 'test-agency',
            mainAgency: { name: 'Agence Principale' },
        };

        await service.create(dto);

        expect(mockUserService.inviteUser).not.toHaveBeenCalled();
    });

    it('should update tenant branding', async () => {
        const id = 'tenant-id';
        const dto = { name: 'Updated Name', logoUrl: 'http://example.com/logo.png' };

        const result = await service.updateBranding(id, dto);

        expect(mockRepository.update).toHaveBeenCalledWith(id, {
            name: 'Updated Name',
            logoUrl: 'http://example.com/logo.png',
        });
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id });
        expect(result.name).toEqual(dto.name);
    });

    it('should update tenant config', async () => {
        const id = 'tenant-id';
        const dto = {
            express_multiplier: 2.0,
            express_sla_hours: 12,
            express_enabled: true,
            currency: 'EUR',
            weight_unit: 'kg',
            express_visibility: {
                showTTC: true,
                allowDiscounts: false,
                showInventory: true,
            },
        };

        await service.updateConfig(id, dto);

        expect(mockRepository.update).toHaveBeenCalledWith(id, {
            ...dto,
            currency: 'EUR',
        });
        expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id });
    });
});
