import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { SiteService } from '../sites/site.service';
import { Tenant } from '../tenant/entities/tenant.entity';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UserService', () => {
    let service: UserService;

    const mockKeycloakService = {
        createUser: jest.fn(),
        findUsersByAttribute: jest.fn(),
        resendInvitationEmail: jest.fn(),
    };

    const mockSiteService = {
        validate: jest.fn(),
    };

    const mockTenantRepository = {
        findOneBy: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
            if (key === 'KEYCLOAK_REALM') return 'cleantrack';
            return defaultValue;
        }),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockTenantRepository.findOneBy.mockResolvedValue({ id: 'tenant-xyz', name: 'FuturPress' });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: KeycloakService, useValue: mockKeycloakService },
                { provide: SiteService, useValue: mockSiteService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: getRepositoryToken(Tenant), useValue: mockTenantRepository },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('inviteUser', () => {
        it('should call keycloakService.createUser with correct attributes for site roles', async () => {
            const dto: InviteUserDto = {
                email: 'test@example.com',
                role: 'Admin_Site',
                siteId: 'site-123',
                firstName: 'Jean',
                lastName: 'Dupont',
            };
            const tenantId = 'tenant-xyz';

            mockSiteService.validate.mockResolvedValue(true);

            await service.inviteUser(tenantId, dto);

            expect(mockSiteService.validate).toHaveBeenCalledWith(tenantId, dto.siteId);
            expect(mockKeycloakService.createUser).toHaveBeenCalledWith(
                'cleantrack',
                dto.email,
                {
                    tenant_id: [tenantId],
                    site_ids: [dto.siteId],
                    role: [dto.role],
                },
                'Admin_Site',
                { firstName: 'Jean', lastName: 'Dupont' },
            );
        });

        it('should invite Admin_Tenant without site validation and default profile names', async () => {
            const dto: InviteUserDto = {
                email: 'admin@tenant.local',
                role: 'Admin_Tenant',
                tenantId: 'tenant-xyz',
            };
            const tenantId = 'tenant-xyz';

            await service.inviteUser(tenantId, dto);

            expect(mockSiteService.validate).not.toHaveBeenCalled();
            expect(mockKeycloakService.createUser).toHaveBeenCalledWith(
                'cleantrack',
                dto.email,
                {
                    tenant_id: [tenantId],
                    role: ['Admin_Tenant'],
                },
                'Admin_Tenant',
                { firstName: 'Admin', lastName: 'FuturPress' },
            );
        });

        it('should throw BadRequestException if site role has no siteId', async () => {
            const dto: InviteUserDto = {
                email: 'test@example.com',
                role: 'User_Site',
                firstName: 'Jean',
                lastName: 'Dupont',
            };

            await expect(service.inviteUser('tenant-xyz', dto)).rejects.toThrow(BadRequestException);
            expect(mockKeycloakService.createUser).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if site role has no first or last name', async () => {
            const dto: InviteUserDto = {
                email: 'test@example.com',
                role: 'User_Site',
                siteId: 'site-123',
            };

            mockSiteService.validate.mockResolvedValue(true);

            await expect(service.inviteUser('tenant-xyz', dto)).rejects.toThrow(BadRequestException);
            expect(mockKeycloakService.createUser).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException if siteId does not belong to tenant', async () => {
            const dto: InviteUserDto = {
                email: 'test@example.com',
                role: 'Admin_Site',
                siteId: 'site-999',
                firstName: 'Jean',
                lastName: 'Dupont',
            };
            const tenantId = 'tenant-xyz';

            mockSiteService.validate.mockResolvedValue(false);

            await expect(service.inviteUser(tenantId, dto)).rejects.toThrow(ForbiddenException);
            expect(mockSiteService.validate).toHaveBeenCalledWith(tenantId, dto.siteId);
            expect(mockKeycloakService.createUser).not.toHaveBeenCalled();
        });
    });

    describe('resendInvitation', () => {
        it('should resend invitation when user has UPDATE_PASSWORD action', async () => {
            const tenantId = 'tenant-xyz';
            const userId = 'user-123';
            mockKeycloakService.findUsersByAttribute.mockResolvedValue([
                {
                    id: userId,
                    email: 'admin@tenant.local',
                    requiredActions: ['UPDATE_PASSWORD'],
                    attributes: { role: ['Admin_Tenant'], tenant_id: [tenantId] },
                },
            ]);

            const result = await service.resendInvitation(tenantId, userId);

            expect(mockKeycloakService.resendInvitationEmail).toHaveBeenCalledWith(
                'cleantrack',
                userId,
                ['UPDATE_PASSWORD'],
                'admin@tenant.local',
                { firstName: 'Admin', lastName: 'FuturPress' },
            );
            expect(result).toEqual({ userId, status: 'invitation_resent' });
        });

        it('should resend invitation using username when email field is empty in Keycloak', async () => {
            const tenantId = 'tenant-xyz';
            const userId = 'user-123';
            mockKeycloakService.findUsersByAttribute.mockResolvedValue([
                {
                    id: userId,
                    username: 'admin.futurpress@cleantrack.pro',
                    requiredActions: ['UPDATE_PASSWORD'],
                    attributes: { role: ['Admin_Tenant'], tenant_id: [tenantId] },
                },
            ]);

            const result = await service.resendInvitation(tenantId, userId);

            expect(mockKeycloakService.resendInvitationEmail).toHaveBeenCalledWith(
                'cleantrack',
                userId,
                ['UPDATE_PASSWORD'],
                'admin.futurpress@cleantrack.pro',
                { firstName: 'Admin', lastName: 'FuturPress' },
            );
            expect(result).toEqual({ userId, status: 'invitation_resent' });
        });

        it('should throw BadRequestException when user has no email', async () => {
            mockKeycloakService.findUsersByAttribute.mockResolvedValue([
                { id: 'user-123', username: 'legacy-user', requiredActions: ['UPDATE_PASSWORD'] },
            ]);

            await expect(service.resendInvitation('tenant-xyz', 'user-123')).rejects.toThrow(
                BadRequestException,
            );
            expect(mockKeycloakService.resendInvitationEmail).not.toHaveBeenCalled();
        });
    });
});
