import { getEffectiveRealmRoles, ROLE_INHERITANCE } from './roles';

describe('auth roles', () => {
    it('includes User_Site when Admin_Site is assigned', () => {
        expect(getEffectiveRealmRoles('Admin_Site')).toEqual(['Admin_Site', 'User_Site']);
    });

    it('returns only the primary role when no inheritance exists', () => {
        expect(getEffectiveRealmRoles('User_Site')).toEqual(['User_Site']);
        expect(getEffectiveRealmRoles('Admin_Tenant')).toEqual(['Admin_Tenant']);
    });

    it('documents Admin_Site inheritance', () => {
        expect(ROLE_INHERITANCE.Admin_Site).toEqual(['User_Site']);
    });
});
