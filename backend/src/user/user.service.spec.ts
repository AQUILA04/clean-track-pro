
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { InviteUserDto } from './dto/invite-user.dto';

describe('UserService', () => {
    let service: UserService;
    let keycloakService: KeycloakService;

    const mockKeycloakService = {
        createUser: jest.fn(),
        findUsersByAttribute: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: KeycloakService, useValue: mockKeycloakService },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        keycloakService = module.get<KeycloakService>(KeycloakService);
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

            await service.inviteUser(tenantId, dto);

            const realm = process.env.KEYCLOAK_REALM || 'master';
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
    });

    describe('getUsers', () => {
        it('should call keycloakService.findUsersByAttribute', async () => {
            const tenantId = 'tenant-xyz';
            await service.getUsers(tenantId);

            const realm = process.env.KEYCLOAK_REALM || 'master';
            expect(mockKeycloakService.findUsersByAttribute).toHaveBeenCalledWith(
                realm,
                'tenant_id',
                tenantId
            );
        });
    });
});
