import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export interface AuthUser {
    id: string;
    email: string;
    roles: string[];
    tenant_id?: string;
    site_ids?: string[];
}

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthUser => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        const rawTenantId = user.tenant_id;
        const tenant_id = Array.isArray(rawTenantId)
            ? (rawTenantId[0] != null ? String(rawTenantId[0]) : undefined)
            : rawTenantId;

        const rawSiteIds = user.site_ids;
        const site_ids = Array.isArray(rawSiteIds)
            ? rawSiteIds.map(String)
            : rawSiteIds
              ? [String(rawSiteIds)]
              : undefined;

        // Extract from Keycloak token structure
        return {
            id: user.sub,
            email: user.email || user.preferred_username,
            roles: user.realm_access?.roles || [],
            tenant_id,
            site_ids,
        };
    },
);
