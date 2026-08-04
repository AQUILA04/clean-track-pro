/** Technical role names used in code and Keycloak. */
export const APP_REALM_ROLES = [
    'Superadmin',
    'Super_Admin',
    'Admin_Tenant',
    'Admin_Site',
    'User_Site',
    'Livreur',
] as const;

/** Roles implicitly granted when a primary role is assigned. */
export const ROLE_INHERITANCE: Record<string, string[]> = {
    Admin_Site: ['User_Site'],
};

export function getEffectiveRealmRoles(primaryRole: string): string[] {
    const inherited = ROLE_INHERITANCE[primaryRole] ?? [];
    return Array.from(new Set([primaryRole, ...inherited]));
}
