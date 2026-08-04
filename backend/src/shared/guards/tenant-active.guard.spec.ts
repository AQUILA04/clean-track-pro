import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { META_UNPROTECTED } from 'nest-keycloak-connect';
import { TenantActiveGuard, TENANT_DEACTIVATED_MESSAGE } from './tenant-active.guard';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';

describe('TenantActiveGuard', () => {
    let guard: TenantActiveGuard;
    let reflector: Reflector;
    let mockRepository: { query: jest.Mock };

    const createContext = (
        user?: Record<string, unknown>,
        authorization?: string,
    ): ExecutionContext =>
        ({
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                    headers: authorization ? { authorization } : {},
                }),
            }),
            getHandler: () => ({}),
            getClass: () => ({}),
        }) as ExecutionContext;

    beforeEach(async () => {
        mockRepository = {
            query: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantActiveGuard,
                Reflector,
                {
                    provide: getRepositoryToken(Tenant),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        guard = module.get(TenantActiveGuard);
        reflector = module.get(Reflector);
    });

    it('should allow Superadmin regardless of tenant status', async () => {
        const context = createContext({
            tenant_id: 'tenant-1',
            realm_access: { roles: ['Superadmin'] },
        });

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(mockRepository.query).not.toHaveBeenCalled();
    });

    it('should allow active tenant users', async () => {
        mockRepository.query.mockResolvedValue([{ is_active: true }]);

        const context = createContext({
            tenant_id: 'tenant-1',
            realm_access: { roles: ['Admin_Tenant'] },
        });

        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should block deactivated tenant users', async () => {
        mockRepository.query.mockResolvedValue([{ is_active: false }]);

        const context = createContext({
            tenant_id: 'tenant-1',
            realm_access: { roles: ['User_Site'] },
        });

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(context)).rejects.toThrow(TENANT_DEACTIVATED_MESSAGE);
    });

    it('should normalize array tenant_id claims', async () => {
        mockRepository.query.mockResolvedValue([{ is_active: false }]);

        const context = createContext({
            tenant_id: ['tenant-1'],
            realm_access: { roles: ['Admin_Site'] },
        });

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
        expect(mockRepository.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT is_active'),
            ['tenant-1'],
        );
    });

    it('should resolve user from Bearer JWT when request.user is missing', async () => {
        mockRepository.query.mockResolvedValue([{ is_active: false }]);
        const payload = Buffer.from(
            JSON.stringify({
                tenant_id: 'tenant-1',
                realm_access: { roles: ['User_Site'] },
            }),
        ).toString('base64url');
        const jwt = `hdr.${payload}.sig`;

        const context = createContext(undefined, `Bearer ${jwt}`);

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should skip check for public routes (custom + keycloak metadata)', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
            if (key === IS_PUBLIC_KEY || key === META_UNPROTECTED) return true;
            return false;
        });

        const context = createContext({
            tenant_id: 'tenant-1',
            realm_access: { roles: ['User_Site'] },
        });

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(mockRepository.query).not.toHaveBeenCalled();
    });

    it('should block when tenant row is missing', async () => {
        mockRepository.query.mockResolvedValue([]);

        const context = createContext({
            tenant_id: 'missing-tenant',
            realm_access: { roles: ['Admin_Tenant'] },
        });

        await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
});
