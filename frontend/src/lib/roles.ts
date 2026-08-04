export function parseJwtPayload(token: string): Record<string, unknown> {
    try {
        const base64 = token.split('.')[1];
        if (!base64) return {};
        const json = Buffer.from(base64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        return JSON.parse(json) as Record<string, unknown>;
    } catch {
        return {};
    }
}

export const APP_REALM_ROLES = [
    'Superadmin',
    'Super_Admin',
    'Admin_Tenant',
    'Admin_Site',
    'User_Site',
    'Livreur',
] as const;

export type AppRealmRole = (typeof APP_REALM_ROLES)[number];

export function normalizeRoles(roles: unknown): string[] {
    if (!Array.isArray(roles)) return [];
    return roles.map((role) => String(role));
}

/**
 * Technical role → user-facing label (French).
 * Never surface Admin_Site / Admin_Tenant (or "admin site" / "admin tenant") in UI copy.
 * See .cursor/rules/ui-display-conventions.mdc
 */
export const ROLE_DISPLAY_LABELS: Record<string, string> = {
    Admin_Tenant: 'Manager général',
    Admin_Site: "Manager d'agence",
    User_Site: "Opérateur d'agence",
    Livreur: 'Livreur',
    Superadmin: 'Superadmin',
    Super_Admin: 'Superadmin',
};

export function getRoleDisplayLabel(role: string | undefined | null): string {
    if (!role) return ROLE_DISPLAY_LABELS.User_Site;
    return ROLE_DISPLAY_LABELS[role] ?? role;
}

/** Roles implicitly granted when a primary role is held. */
export const ROLE_INHERITANCE: Record<string, string[]> = {
    Admin_Site: ['User_Site'],
};

function stripRolePrefix(role: string): string {
    if (role.startsWith('realm:')) return role.slice('realm:'.length);
    const colonIndex = role.lastIndexOf(':');
    if (colonIndex >= 0) return role.slice(colonIndex + 1);
    return role;
}

function normalizeAppRole(role: string): string {
    const stripped = stripRolePrefix(role);
    const canonical = APP_REALM_ROLES.find(
        (appRole) => appRole.toLowerCase() === stripped.toLowerCase(),
    );
    return canonical ?? stripped;
}

function extractRoleAttributeClaim(payload: Record<string, unknown>): string[] {
    const role = payload.role;
    if (Array.isArray(role)) return role.map(String).filter(Boolean);
    if (typeof role === 'string' && role) return [role];
    return [];
}

/** Build effective app roles from a Keycloak access-token payload. */
export function resolveRolesFromTokenPayload(payload: Record<string, unknown>): string[] {
    const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
    const realmRoles = (realmAccess?.roles ?? []).map(normalizeAppRole);
    const attributeRoles = extractRoleAttributeClaim(payload).map(normalizeAppRole);

    const merged = Array.from(new Set([...realmRoles, ...attributeRoles]));
    const appRoles = merged.filter((role) =>
        APP_REALM_ROLES.some((appRole) => appRole === role),
    );

    return expandEffectiveRoles(appRoles.length > 0 ? appRoles : merged);
}

/** Resolve roles from a NextAuth session user (roles array + optional primary role claim). */
export function getSessionRoles(
    user: { roles?: string[]; role?: string } | undefined | null,
): string[] {
    if (!user) return [];
    const combined = [...(user.roles ?? []), ...(user.role ? [user.role] : [])];
    return expandEffectiveRoles(combined);
}

export function expandEffectiveRoles(roles: unknown): string[] {
    const normalized = normalizeRoles(roles).map(stripRolePrefix);
    const expanded = new Set<string>();

    for (const role of normalized) {
        expanded.add(role);
        for (const inherited of ROLE_INHERITANCE[role] ?? []) {
            expanded.add(inherited);
        }
    }

    return Array.from(expanded);
}

export function hasAnyRole(userRoles: unknown, allowed: string[]): boolean {
    const effective = expandEffectiveRoles(userRoles);
    return allowed.some((role) =>
        effective.some((userRole) => userRole === role)
    );
}

export function canManageStorageSlots(userRoles: unknown): boolean {
    return hasAnyRole(userRoles, ['Admin_Site', 'Superadmin', 'Super_Admin', 'Admin_Tenant']);
}

export function getSiteIdFromSession(user: Record<string, unknown> | undefined | null): string {
    if (!user) return '';
    const siteIds = user.site_ids;
    if (Array.isArray(siteIds) && siteIds.length > 0) {
        return String(siteIds[0]);
    }
    if (typeof user.site_id === 'string' && user.site_id) {
        return user.site_id;
    }
    return '';
}
