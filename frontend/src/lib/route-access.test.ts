import { canAccessPath, getAllowedRolesForPath } from './route-access';

describe('route-access', () => {
    it('maps nav paths to roles', () => {
        expect(getAllowedRolesForPath('/catalogue')).toEqual(
            expect.arrayContaining(['Admin_Tenant']),
        );
        expect(getAllowedRolesForPath('/orders')).toEqual(
            expect.arrayContaining(['User_Site', 'Admin_Site']),
        );
        expect(getAllowedRolesForPath('/admin/tenants')).toEqual(
            expect.arrayContaining(['Superadmin', 'Super_Admin']),
        );
    });

    it('allows nested agency detail for Admin_Tenant', () => {
        expect(canAccessPath(['Admin_Tenant'], '/agencies/abc')).toBe(true);
        expect(canAccessPath(['User_Site'], '/agencies/abc')).toBe(false);
    });

    it('blocks User_Site from catalogue', () => {
        expect(canAccessPath(['User_Site'], '/catalogue')).toBe(false);
    });

    it('allows Admin_Site on dashboard and ops', () => {
        expect(canAccessPath(['Admin_Site'], '/dashboard')).toBe(true);
        expect(canAccessPath(['Admin_Site'], '/workflow')).toBe(true);
        expect(canAccessPath(['Admin_Site'], '/catalogue')).toBe(false);
    });

    it('skips public paths', () => {
        expect(getAllowedRolesForPath('/')).toBeNull();
        expect(canAccessPath([], '/signup')).toBe(true);
    });

    it('allows expenses for site and tenant roles', () => {
        expect(canAccessPath(['User_Site'], '/expenses')).toBe(true);
        expect(canAccessPath(['Admin_Site'], '/expenses/types')).toBe(true);
        expect(canAccessPath(['User_Site'], '/expenses/types')).toBe(false);
    });
});
