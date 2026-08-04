import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { META_UNPROTECTED } from 'nest-keycloak-connect';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';
import { Tenant } from '../../tenant/entities/tenant.entity';

const SUPERADMIN_ROLES = ['Superadmin', 'Super_Admin'];
export const TENANT_DEACTIVATED_MESSAGE =
    "Votre organisation n'est actuellement pas active ou ne dispose pas d'un plan d'abonnement valide. Pour régulariser votre situation, veuillez contacter le support à l'adresse support@cleantrack.com.";

@Injectable()
export class TenantActiveGuard implements CanActivate {
    private readonly logger = new Logger(TenantActiveGuard.name);

    constructor(
        private readonly reflector: Reflector,
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic =
            this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ||
            this.reflector.getAllAndOverride<boolean>(META_UNPROTECTED, [
                context.getHandler(),
                context.getClass(),
            ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = this.resolveUser(request);
        if (!user) {
            // AuthGuard will reject unauthenticated requests; avoid false positives here.
            return true;
        }

        const roles = this.resolveRoles(user);
        if (roles.some((role) => SUPERADMIN_ROLES.includes(role))) {
            return true;
        }

        const tenantId = this.normalizeTenantId(user.tenant_id);
        if (!tenantId) {
            this.logger.debug('Skipping tenant active check: no tenant_id on token');
            return true;
        }

        const isActive = await this.isTenantActive(tenantId);
        if (!isActive) {
            this.logger.warn(`Blocked request for deactivated tenant ${tenantId}`);
            throw new ForbiddenException(TENANT_DEACTIVATED_MESSAGE);
        }

        return true;
    }

    private resolveUser(request: {
        user?: Record<string, unknown>;
        accessTokenJWT?: string;
        headers?: { authorization?: string };
    }): Record<string, unknown> | null {
        if (request.user) {
            return request.user;
        }

        const jwt =
            request.accessTokenJWT ||
            this.extractBearer(request.headers?.authorization);
        if (!jwt) {
            return null;
        }

        try {
            const payload = jwt.split('.')[1];
            if (!payload) return null;
            const json = Buffer.from(payload, 'base64url').toString('utf8');
            return JSON.parse(json) as Record<string, unknown>;
        } catch {
            return null;
        }
    }

    private extractBearer(authorization?: string): string | null {
        if (!authorization?.startsWith('Bearer ')) {
            return null;
        }
        return authorization.slice(7).trim() || null;
    }

    private resolveRoles(user: Record<string, unknown>): string[] {
        const realmAccess = user.realm_access as { roles?: unknown } | undefined;
        const fromRealm = Array.isArray(realmAccess?.roles)
            ? realmAccess.roles.map(String)
            : [];
        const fromRoles = Array.isArray(user.roles) ? user.roles.map(String) : [];
        const fromRoleClaim = Array.isArray(user.role)
            ? user.role.map(String)
            : typeof user.role === 'string'
              ? [user.role]
              : [];
        return [...fromRealm, ...fromRoles, ...fromRoleClaim];
    }

    private normalizeTenantId(value: unknown): string | undefined {
        if (Array.isArray(value)) {
            const first = value[0];
            return first != null && String(first).trim() ? String(first).trim() : undefined;
        }
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
        return undefined;
    }

    private async isTenantActive(tenantId: string): Promise<boolean> {
        // Raw SQL avoids entity defaults / select quirks; postgres role bypasses RLS.
        const rows: Array<{ is_active: boolean }> = await this.tenantRepository.query(
            `SELECT is_active FROM tenants WHERE id = $1 LIMIT 1`,
            [tenantId],
        );
        if (!rows.length) {
            return false;
        }
        return rows[0].is_active === true;
    }
}
