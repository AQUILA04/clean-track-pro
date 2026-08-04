import {
    expandEffectiveRoles,
    getRoleDisplayLabel,
    getSessionRoles,
    hasAnyRole,
    resolveRolesFromTokenPayload,
    ROLE_DISPLAY_LABELS,
    ROLE_INHERITANCE,
} from '@/lib/roles';

describe('roles', () => {
    describe('getRoleDisplayLabel', () => {
        it('maps technical roles to user-facing labels', () => {
            expect(getRoleDisplayLabel('Admin_Tenant')).toBe('Manager général');
            expect(getRoleDisplayLabel('Admin_Site')).toBe("Manager d'agence");
            expect(getRoleDisplayLabel('User_Site')).toBe("Opérateur d'agence");
        });

        it('falls back to the raw role when unknown', () => {
            expect(getRoleDisplayLabel('Custom_Role')).toBe('Custom_Role');
        });
    });

    describe('expandEffectiveRoles', () => {
        it('grants User_Site to Admin_Site holders', () => {
            expect(expandEffectiveRoles(['Admin_Site'])).toEqual(
                expect.arrayContaining(['Admin_Site', 'User_Site']),
            );
        });

        it('supports realm-prefixed roles', () => {
            expect(expandEffectiveRoles(['realm:Admin_Site'])).toEqual(
                expect.arrayContaining(['Admin_Site', 'User_Site']),
            );
        });
    });

    describe('resolveRolesFromTokenPayload', () => {
        it('merges realm roles and role attribute claim', () => {
            const roles = resolveRolesFromTokenPayload({
                realm_access: { roles: ['default-roles-cleantrack'] },
                role: 'Admin_Site',
            });

            expect(roles).toEqual(expect.arrayContaining(['Admin_Site', 'User_Site']));
        });

        it('expands Admin_Site from realm role only', () => {
            const roles = resolveRolesFromTokenPayload({
                realm_access: { roles: ['Admin_Site', 'offline_access'] },
            });

            expect(roles).toEqual(expect.arrayContaining(['Admin_Site', 'User_Site']));
        });
    });

    describe('getSessionRoles', () => {
        it('uses primary role claim when roles array is empty', () => {
            expect(getSessionRoles({ role: 'Admin_Site' })).toEqual(
                expect.arrayContaining(['Admin_Site', 'User_Site']),
            );
        });
    });

    describe('hasAnyRole', () => {
        it('allows Admin_Site to access User_Site permissions', () => {
            expect(hasAnyRole(['Admin_Site'], ['User_Site'])).toBe(true);
        });

        it('does not grant Admin_Site permissions to User_Site', () => {
            expect(hasAnyRole(['User_Site'], ['Admin_Site'])).toBe(false);
        });
    });

    it('exports expected role constants', () => {
        expect(ROLE_INHERITANCE.Admin_Site).toEqual(['User_Site']);
        expect(ROLE_DISPLAY_LABELS.Admin_Tenant).toBe('Manager général');
    });
});
