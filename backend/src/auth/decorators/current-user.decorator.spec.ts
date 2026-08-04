import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser, AuthUser } from './current-user.decorator';

/** Extract the factory passed to createParamDecorator (NestJS returns a decorator, not the factory). */
function getParamDecoratorFactory(decorator: Function) {
    class Test {
        public test(@decorator() _value: unknown) {}
    }

    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test.prototype.constructor, 'test');
    return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser Decorator', () => {
    const factory = getParamDecoratorFactory(CurrentUser);

    it('should extract user from request and return AuthUser', () => {
        const mockUser = {
            sub: 'user-123',
            email: 'test@example.com',
            realm_access: {
                roles: ['Admin_Tenant', 'User_Site'],
            },
            tenant_id: 'tenant-456',
            site_ids: ['site-1', 'site-2'],
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({ user: mockUser }),
            }),
        } as ExecutionContext;

        const result = factory(undefined, mockContext) as AuthUser;

        expect(result).toEqual({
            id: 'user-123',
            email: 'test@example.com',
            roles: ['Admin_Tenant', 'User_Site'],
            tenant_id: 'tenant-456',
            site_ids: ['site-1', 'site-2'],
        });
    });

    it('should use preferred_username if email is missing', () => {
        const mockUser = {
            sub: 'user-123',
            preferred_username: 'testuser',
            realm_access: {
                roles: ['Superadmin'],
            },
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({ user: mockUser }),
            }),
        } as ExecutionContext;

        const result = factory(undefined, mockContext) as AuthUser;

        expect(result.email).toBe('testuser');
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({ user: null }),
            }),
        } as ExecutionContext;

        expect(() => factory(undefined, mockContext)).toThrow(UnauthorizedException);
        expect(() => factory(undefined, mockContext)).toThrow('User not authenticated');
    });

    it('should handle missing realm_access gracefully', () => {
        const mockUser = {
            sub: 'user-123',
            email: 'test@example.com',
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({ user: mockUser }),
            }),
        } as ExecutionContext;

        const result = factory(undefined, mockContext) as AuthUser;

        expect(result.roles).toEqual([]);
    });

    it('should extract tenant_id from JWT claims', () => {
        const mockUser = {
            sub: 'user-123',
            email: 'admin@tenant.com',
            realm_access: { roles: ['Admin_Tenant'] },
            tenant_id: 'tenant-uuid-789',
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({ user: mockUser }),
            }),
        } as ExecutionContext;

        const result = factory(undefined, mockContext) as AuthUser;

        expect(result.tenant_id).toBe('tenant-uuid-789');
    });

    it('should normalize array tenant_id and site_ids from JWT claims', () => {
        const mockUser = {
            sub: 'user-123',
            email: 'admin@tenant.com',
            realm_access: { roles: ['Admin_Tenant'] },
            tenant_id: ['tenant-uuid-789'],
            site_ids: ['site-1', 'site-2'],
        };

        const mockContext = {
            switchToHttp: () => ({
                getRequest: () => ({ user: mockUser }),
            }),
        } as ExecutionContext;

        const result = factory(undefined, mockContext) as AuthUser;

        expect(result.tenant_id).toBe('tenant-uuid-789');
        expect(result.site_ids).toEqual(['site-1', 'site-2']);
    });
});
