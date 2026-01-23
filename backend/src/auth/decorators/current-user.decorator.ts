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

        // Extract from Keycloak token structure
        return {
            id: user.sub,
            email: user.email || user.preferred_username,
            roles: user.realm_access?.roles || [],
            tenant_id: user.tenant_id,
            site_ids: user.site_ids,
        };
    },
);
