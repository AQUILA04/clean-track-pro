import { Reflector } from '@nestjs/core';
import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles Decorator', () => {
    it('should set roles metadata', () => {
        const reflector = new Reflector();

        @Roles('Admin_Tenant', 'Superadmin')
        class TestController { }

        const roles = reflector.get<string[]>(ROLES_KEY, TestController);
        expect(roles).toEqual(['Admin_Tenant', 'Superadmin']);
    });

    it('should work with single role', () => {
        const reflector = new Reflector();

        @Roles('User_Site')
        class TestController { }

        const roles = reflector.get<string[]>(ROLES_KEY, TestController);
        expect(roles).toEqual(['User_Site']);
    });
});
