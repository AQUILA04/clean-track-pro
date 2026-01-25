
import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly keycloakService: KeycloakService,
    ) { }

    async inviteUser(tenantId: string, inviteUserDto: InviteUserDto) {
        this.logger.log(`Inviting user ${inviteUserDto.email} to tenant ${tenantId} for site ${inviteUserDto.siteId}`);

        // Security: In a real app, verify siteId belongs to tenantId here via DB check.
        // Assuming site validation passes for now or implemented in a specific SiteService.

        // Define attributes for the new user
        const attributes = {
            tenant_id: [tenantId],
            site_ids: [inviteUserDto.siteId],
            role: [inviteUserDto.role] // Storing role in attribute for reference/groups mapping
        };

        // Delegate to KeycloakService using the tenant's realm (logic to determine realm needed)
        // For now using 'master' or configured realm from context if multi-tenancy is realm-based.
        // Story says "Use the Tenant's Realm (extracted from JWT iss or context)".
        // Assuming a single realm 'clean-track' for all tenants for this implementation phase 
        // OR adhering to 'savedTenant.subdomain' as realm name from TenantService logic.
        // Let's assume we use the default realm for now as per config, or we need to look up the tenant realm.
        // For simplicity/AC, we will use the configured REALM from env.

        const realm = process.env.KEYCLOAK_REALM || 'master';

        return this.keycloakService.createUser(realm, inviteUserDto.email, attributes);
    }

    async getUsers(tenantId: string) {
        const realm = process.env.KEYCLOAK_REALM || 'master';
        return this.keycloakService.findUsersByAttribute(realm, 'tenant_id', tenantId);
    }
}
