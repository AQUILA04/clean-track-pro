import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { Tenant } from './entities/tenant.entity';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

describe('TenantService', () => {
    let service: TenantService;
    let mockRepository: any;
    let mockKeycloakService: any;

    beforeEach(async () => {
        mockRepository = {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest.fn().mockImplementation((tenant) => Promise.resolve({
                id: 'generated-uuid',
                created_at: new Date(),
                ...tenant
            })),
            find: jest.fn().mockResolvedValue([]),
        };

        mockKeycloakService = {
            createRealm: jest.fn().mockResolvedValue(undefined),
            createClient: jest.fn().mockResolvedValue(undefined),
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
            subdomain: 'test-agency'
        };

        const result = await service.create(dto);

        expect(result).toBeDefined();
        expect(result.id).toEqual('generated-uuid');
        expect(mockRepository.create).toHaveBeenCalledWith(dto);
        expect(mockRepository.save).toHaveBeenCalled();
        expect(mockKeycloakService.createRealm).toHaveBeenCalledWith(dto.subdomain);
        expect(mockKeycloakService.createClient).toHaveBeenCalledWith(dto.subdomain, dto.name);
    });
});
