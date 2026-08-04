import { ROUTE_ACCESS_RULES } from '@/lib/route-access-rules';

/** Edge-safe role helpers (no Buffer / Node APIs). */
function stripRolePrefix(role: string): string {
    if (role.startsWith('realm:')) return role.slice('realm:'.length);
    const colonIndex = role.lastIndexOf(':');
    if (colonIndex >= 0) return role.slice(colonIndex + 1);
    return role;
}

const ROLE_INHERITANCE: Record<string, string[]> = {
    Admin_Site: ['User_Site'],
};

function expandEffectiveRoles(roles: unknown): string[] {
    const normalized = (Array.isArray(roles) ? roles : []).map((r) =>
        stripRolePrefix(String(r)),
    );
    const expanded = new Set<string>();
    for (const role of normalized) {
        expanded.add(role);
        for (const inherited of ROLE_INHERITANCE[role] ?? []) {
            expanded.add(inherited);
        }
    }
    return Array.from(expanded);
}

function hasAnyRole(userRoles: unknown, allowed: string[]): boolean {
    const effective = expandEffectiveRoles(userRoles);
    return allowed.some((role) => effective.some((userRole) => userRole === role));
}

/**
 * Resolve allowed roles for a dashboard path by matching the longest href prefix.
 */
export function getAllowedRolesForPath(pathname: string): string[] | null {
    const path = pathname.split('?')[0].replace(/\/$/, '') || '/';

    if (
        path === '/' ||
        path.startsWith('/auth') ||
        path.startsWith('/api') ||
        path.startsWith('/signup') ||
        path.startsWith('/_next')
    ) {
        return null;
    }

    const matches = ROUTE_ACCESS_RULES.filter(
        (item) => path === item.href || path.startsWith(`${item.href}/`),
    ).sort((a, b) => b.href.length - a.href.length);

    if (matches.length > 0) {
        return matches[0].allowedRoles;
    }

    if (path.startsWith('/admin')) {
        return ['Superadmin', 'Super_Admin'];
    }

    return ['Admin_Tenant', 'Admin_Site', 'User_Site', 'Superadmin', 'Super_Admin'];
}

export function canAccessPath(userRoles: unknown, pathname: string): boolean {
    const allowed = getAllowedRolesForPath(pathname);
    if (allowed === null) return true;
    return hasAnyRole(userRoles, allowed);
}
