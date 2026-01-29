
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { SiteService } from '../sites/site.service';
import { TenantService } from '../tenant/tenant.service';
import { ForbiddenException } from '@nestjs/common';

describe('UserService', () => {
    let service: UserService;
    let keycloakService: KeycloakService;
    let siteService: SiteService;
    let tenantService: TenantService;

    const mockKeycloakService = {
        createUser: jest.fn(),
        findUsersByAttribute: jest.fn(),
    };

    const mockSiteService = {
        validate: jest.fn(),
    };

    const mockTenantService = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: KeycloakService, useValue: mockKeycloakService },
                { provide: SiteService, useValue: mockSiteService },
                { provide: TenantService, useValue: mockTenantService },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        keycloakService = module.get<KeycloakService>(KeycloakService);
        siteService = module.get<SiteService>(SiteService);
        tenantService = module.get<TenantService>(TenantService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('inviteUser', () => {
        it('should call keycloakService.createUser with correct attributes', async () => {
            const dto: InviteUserDto = {
                email: 'test@example.com',
                role: 'Admin_Site',
                siteId: 'site-123',
            };
            const tenantId = 'tenant-xyz';

            const realm = process.env.KEYCLOAK_REALM || 'master';
            mockSiteService.validate.mockResolvedValue(true);
            mockTenantService.findOne.mockResolvedValue({ subdomain: realm });

            await service.inviteUser(tenantId, dto);

            expect(mockSiteService.validate).toHaveBeenCalledWith(tenantId, dto.siteId);
            expect(mockKeycloakService.createUser).toHaveBeenCalledWith(
                realm,
                dto.email,
                {
                    tenant_id: [tenantId],
                    site_ids: [dto.siteId],
                    role: [dto.role],
                },
            );
        });

        it('should throw ForbiddenException if siteId does not belong to tenant', async () => {
            const dto: InviteUserDto = {
                email: 'test@example.com',
                role: 'Admin_Site',
                siteId: 'site-999',
            };
            const tenantId = 'tenant-xyz';

            mockSiteService.validate.mockResolvedValue(false);

            await expect(service.inviteUser(tenantId, dto)).rejects.toThrow(ForbiddenException);
            expect(mockSiteService.validate).toHaveBeenCalledWith(tenantId, dto.siteId);
            expect(mockKeycloakService.createUser).not.toHaveBeenCalled();
        });
    });

    describe('getUsers', () => {
        it('should call keycloakService.findUsersByAttribute with tenant realm', async () => {
            const tenantId = 'tenant-xyz';
            const tenantRealm = 'tenant-realm';

            // Mock TenantService to return a tenant with a specific subdomain (realm)
            mockTenantService.findOne.mockResolvedValue({ subdomain: tenantRealm });

            await service.getUsers(tenantId);

            expect(mockTenantService.findOne).toHaveBeenCalledWith(tenantId);
            expect(mockKeycloakService.findUsersByAttribute).toHaveBeenCalledWith(
                tenantRealm,
                'tenant_id',
                tenantId
            );
        });
    });
});
