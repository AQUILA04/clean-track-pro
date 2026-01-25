
import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenancyGuard implements CanActivate {
    private readonly logger = new Logger(TenancyGuard.name);

    constructor(private readonly cls: ClsService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user) {
            // Extract connection info
            if (user.tenant_id) {
                this.cls.set('tenantId', user.tenant_id);
                this.logger.debug(`Context set: tenantId=${user.tenant_id}`);
            }

            // Extract Roles for Superadmin bypass
            // Assuming Keycloak structure: realm_access.roles or roles array
            // We need to map this to 'superadmin' or 'user' for the DB policy
            const roles = user.realm_access?.roles || user.roles || [];

            if (roles.includes('superadmin') || roles.includes('admin')) { // Adjust role name as needed
                this.cls.set('userRole', 'superadmin');
                this.logger.debug(`Context set: userRole=superadmin`);
            } else {
                this.cls.set('userRole', 'user');
            }
        } else {
            this.logger.debug('No user found in request - Context empty');
        }

        return true; // Always allow, just setting context
    }
}
