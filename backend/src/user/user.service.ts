
import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { KeycloakService } from '../shared/keycloak/keycloak.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { SiteService } from '../sites/site.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly keycloakService: KeycloakService,
        private readonly siteService: SiteService,
        private readonly tenantService: TenantService,
    ) { }

    async inviteUser(tenantId: string, inviteUserDto: InviteUserDto) {
        this.logger.log(`Inviting user ${inviteUserDto.email} to tenant ${tenantId} for site ${inviteUserDto.siteId}`);

        // Security: Verify siteId belongs to tenantId
        const isSiteValid = await this.siteService.validate(tenantId, inviteUserDto.siteId);
        if (!isSiteValid) {
            throw new ForbiddenException('Invalid Site ID for this Tenant');
        }

        // Define attributes for the new user
        const attributes = {
            tenant_id: [tenantId],
            site_ids: [inviteUserDto.siteId],
            role: [inviteUserDto.role] // Storing role in attribute for reference/groups mapping
        };

        // Fetch valid realm from Tenant configuration
        const tenant = await this.tenantService.findOne(tenantId);
        const realm = tenant.subdomain;

        return this.keycloakService.createUser(realm, inviteUserDto.email, attributes);
    }

    async getUsers(tenantId: string) {
        const tenant = await this.tenantService.findOne(tenantId);
        const realm = tenant.subdomain;
        return this.keycloakService.findUsersByAttribute(realm, 'tenant_id', tenantId);
    }
}
