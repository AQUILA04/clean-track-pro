import { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { parseJwtPayload, resolveRolesFromTokenPayload } from '@/lib/roles';
import { TENANT_DEACTIVATED_HINT } from '@/lib/tenant-access';

function getKeycloakConfig() {
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
    const issuer = process.env.KEYCLOAK_ISSUER;

    if (!clientId || !clientSecret || !issuer) {
        throw new Error('Missing Keycloak environment variables');
    }

    return { clientId, clientSecret, issuer };
}

function getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
}

function extractClaimsFromAccessToken(accessToken: string) {
    const payload = parseJwtPayload(accessToken);
    const roles = resolveRolesFromTokenPayload(payload);
    const tenantId = payload.tenant_id;
    const siteIds = payload.site_ids;
    const roleClaim = payload.role;
    const primaryRole = Array.isArray(roleClaim)
        ? String(roleClaim[0] ?? '')
        : typeof roleClaim === 'string'
          ? roleClaim
          : roles.find((role) =>
                ['Superadmin', 'Super_Admin', 'Admin_Tenant', 'Admin_Site', 'User_Site'].includes(role),
            );

    return {
        roles,
        role: primaryRole || undefined,
        tenant_id: Array.isArray(tenantId) ? String(tenantId[0]) : (tenantId as string | undefined),
        site_ids: Array.isArray(siteIds)
            ? siteIds.map(String)
            : siteIds
              ? [String(siteIds)]
              : [],
    };
}

function isSuperadmin(roles: string[] | undefined): boolean {
    return Boolean(roles?.some((role) => role === 'Superadmin' || role === 'Super_Admin'));
}

/**
 * Confirms the tenant is still active via the API guard (/tenants/me).
 * Returns false when the backend rejects a deactivated tenant.
 */
async function assertTenantActive(accessToken: string, roles: string[] | undefined): Promise<boolean> {
    if (isSuperadmin(roles)) {
        return true;
    }

    try {
        const response = await fetch(`${getApiUrl()}/tenants/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        });

        if (response.status === 403) {
            const body = await response.json().catch(() => null);
            const message = Array.isArray(body?.message)
                ? body.message.join(' ')
                : String(body?.message ?? '');
            if (message.toLowerCase().includes(TENANT_DEACTIVATED_HINT)) {
                return false;
            }
            // Other 403s (roles) should not kill the session here.
            return true;
        }

        return response.ok || response.status === 401;
    } catch {
        // Do not lock users out on transient network errors during auth bootstrap.
        return true;
    }
}

type JwtToken = {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: 'RefreshAccessTokenError' | 'TenantDeactivated';
    roles?: string[];
    role?: string;
    tenant_id?: string;
    site_ids?: string[];
    id_token?: string;
};

async function refreshAccessToken(token: JwtToken): Promise<JwtToken> {
    try {
        if (!token.refreshToken) {
            throw new Error('Missing refresh token');
        }

        const { issuer, clientId, clientSecret } = getKeycloakConfig();
        const tokenEndpoint = `${issuer}/protocol/openid-connect/token`;

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken,
            }),
        });

        const refreshedTokens = await response.json();
        if (!response.ok) {
            throw refreshedTokens;
        }

        const accessToken = refreshedTokens.access_token as string;
        const claims = extractClaimsFromAccessToken(accessToken);

        if (!(await assertTenantActive(accessToken, claims.roles))) {
            return {
                ...token,
                accessToken,
                roles: claims.roles,
                role: claims.role,
                tenant_id: claims.tenant_id,
                site_ids: claims.site_ids,
                error: 'TenantDeactivated',
            };
        }

        return {
            ...token,
            accessToken,
            accessTokenExpires: Date.now() + ((refreshedTokens.expires_in as number) * 1000),
            refreshToken: (refreshedTokens.refresh_token as string) ?? token.refreshToken,
            roles: claims.roles,
            role: claims.role,
            tenant_id: claims.tenant_id,
            site_ids: claims.site_ids,
            error: undefined,
        };
    } catch {
        return {
            ...token,
            error: 'RefreshAccessTokenError',
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        KeycloakProvider(getKeycloakConfig()),
    ],
    callbacks: {
        async signIn({ account }) {
            if (!account?.access_token) {
                return true;
            }
            const claims = extractClaimsFromAccessToken(account.access_token);
            if (!(await assertTenantActive(account.access_token, claims.roles))) {
                return '/auth/signin?error=TenantDeactivated';
            }
            return true;
        },
        async jwt({ token, account }) {
            if (account?.access_token) {
                const claims = extractClaimsFromAccessToken(account.access_token);
                token.roles = claims.roles;
                token.role = claims.role;
                token.tenant_id = claims.tenant_id;
                token.site_ids = claims.site_ids;
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.accessTokenExpires = account.expires_at
                    ? account.expires_at * 1000
                    : Date.now() + 60 * 1000;
                token.id_token = account.id_token;
                token.error = undefined;
                return token;
            }

            const typedToken = token as JwtToken;
            if (typedToken.error === 'TenantDeactivated') {
                return token;
            }
            if (typedToken.accessTokenExpires && Date.now() < typedToken.accessTokenExpires) {
                return token;
            }

            return refreshAccessToken(typedToken);
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.tenant_id = token.tenant_id;
                session.user.site_ids = token.site_ids;
                session.user.roles = token.roles;
                session.user.role = token.role as string | undefined;
            }
            session.accessToken = token.accessToken as string;
            session.id_token = token.id_token as string;
            session.error = token.error as 'RefreshAccessTokenError' | 'TenantDeactivated' | undefined;
            return session;
        },
    },
    pages: {
        error: '/auth/signin',
        signIn: '/auth/signin',
    },
};
