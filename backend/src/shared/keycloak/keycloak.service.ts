
import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation';
import { APP_REALM_ROLES, getEffectiveRealmRoles } from '../../auth/roles';

type UserProfileAttribute = {
    name: string;
    displayName: string;
    permissions: { view: string[]; edit: string[] };
    multivalued: boolean;
};

type UserProfileConfig = {
    attributes?: UserProfileAttribute[];
    unmanagedAttributePolicy?: 'ENABLED' | 'ADMIN_VIEW' | 'ADMIN_EDIT';
};

type KeycloakUserProfile = {
    firstName?: string;
    lastName?: string;
};

const CUSTOM_USER_ATTRIBUTES: UserProfileAttribute[] = [
    {
        name: 'tenant_id',
        displayName: 'Tenant ID',
        permissions: { view: ['admin'], edit: ['admin'] },
        multivalued: false,
    },
    {
        name: 'site_ids',
        displayName: 'Site IDs',
        permissions: { view: ['admin'], edit: ['admin'] },
        multivalued: true,
    },
    {
        name: 'role',
        displayName: 'Application Role',
        permissions: { view: ['admin'], edit: ['admin'] },
        multivalued: false,
    },
];

@Injectable()
export class KeycloakService implements OnModuleInit {
    private readonly logger = new Logger(KeycloakService.name);
    private readonly kcAdminClient: KcAdminClient;
    private readonly keycloakUrl: string;
    private readonly realm: string;
    private readonly authRealm: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly adminUsername?: string;
    private readonly adminPassword?: string;

    constructor(private configService: ConfigService) {
        this.keycloakUrl = this.configService.get<string>(
            'KEYCLOAK_AUTH_SERVER_URL',
            this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080'),
        );
        this.realm = this.configService.get<string>('KEYCLOAK_REALM', 'cleantrack');
        this.authRealm = this.configService.get<string>(
            'KEYCLOAK_ADMIN_REALM',
            'master',
        );
        this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'admin-cli');
        this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET', '');
        this.adminUsername = this.configService.get<string>('KEYCLOAK_ADMIN');
        this.adminPassword = this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD');

        this.kcAdminClient = new KcAdminClient({
            baseUrl: this.keycloakUrl,
            realmName: this.realm,
        });
    }

    async onModuleInit() {
        try {
            await this.authenticateAdmin();
            await this.ensureUserProfileAttributes(this.realm);
            await this.ensureRoleProtocolMapper(this.realm);
        } catch (error) {
            this.logger.warn(`Failed to connect to Keycloak at startup: ${error.message}. Integration might be degraded.`);
        }
    }

    private normalizeAttributes(attributes: Record<string, any>): Record<string, string[]> {
        const normalized: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(attributes)) {
            if (Array.isArray(value)) {
                normalized[key] = value.map((entry) => String(entry));
            } else if (value !== undefined && value !== null) {
                normalized[key] = [String(value)];
            }
        }
        return normalized;
    }

    private hasAttributeValue(
        attributes: Record<string, string[] | undefined> | undefined,
        attributeName: string,
        expectedValue: string,
    ): boolean {
        const aliases: Record<string, string[]> = {
            tenant_id: ['tenant_id', 'tenantId'],
            site_ids: ['site_ids', 'siteIds'],
        };
        const keys = aliases[attributeName] ?? [attributeName];

        for (const key of keys) {
            const value = attributes?.[key];
            if (Array.isArray(value) && value.includes(expectedValue)) {
                return true;
            }
            if (typeof value === 'string' && value === expectedValue) {
                return true;
            }
        }
        return false;
    }

    async ensureUserProfileAttributes(realm: string): Promise<void> {
        await this.authenticateAdmin();
        const token = await this.kcAdminClient.getAccessToken();
        if (!token) {
            this.logger.warn('Cannot configure Keycloak user profile: missing admin access token.');
            return;
        }

        const profileUrl = `${this.keycloakUrl}/admin/realms/${realm}/users/profile`;
        const response = await fetch(profileUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            this.logger.warn(
                `Could not fetch Keycloak user profile for realm '${realm}' (status ${response.status}).`,
            );
            return;
        }

        const profile = (await response.json()) as UserProfileConfig;
        const existingNames = new Set((profile.attributes ?? []).map((attribute) => attribute.name));
        let changed = false;

        for (const attribute of CUSTOM_USER_ATTRIBUTES) {
            if (!existingNames.has(attribute.name)) {
                profile.attributes = [...(profile.attributes ?? []), attribute];
                changed = true;
            }
        }

        if (profile.unmanagedAttributePolicy !== 'ADMIN_EDIT') {
            profile.unmanagedAttributePolicy = 'ADMIN_EDIT';
            changed = true;
        }

        if (!changed) {
            return;
        }

        const updateResponse = await fetch(profileUrl, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profile),
        });

        if (!updateResponse.ok) {
            const errorBody = await updateResponse.text();
            this.logger.error(
                `Failed to update Keycloak user profile for realm '${realm}': ${errorBody}`,
            );
            return;
        }

        this.logger.log(
            `Keycloak user profile configured for realm '${realm}' (tenant_id, site_ids, role).`,
        );
    }

    async ensureRoleProtocolMapper(realm: string): Promise<void> {
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });

        const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'cleantrack-client');
        const clients = await this.kcAdminClient.clients.find({ clientId });
        if (!clients.length || !clients[0].id) {
            this.logger.warn(`Cannot configure role mapper: client '${clientId}' not found.`);
            return;
        }

        const clientUuid = clients[0].id;
        const mappers = await this.kcAdminClient.clients.listProtocolMappers({ id: clientUuid });
        const existingMapper = mappers.find((mapper) => mapper.name === 'role');

        const mapperConfig = {
            name: 'role',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-usermodel-attribute-mapper',
            config: {
                'user.attribute': 'role',
                'claim.name': 'role',
                'jsonType.label': 'String',
                'id.token.claim': 'true',
                'access.token.claim': 'true',
                'userinfo.token.claim': 'true',
                'aggregate.attrs': 'true',
            },
        };

        if (existingMapper?.id) {
            await this.kcAdminClient.clients.updateProtocolMapper(
                { id: clientUuid, mapperId: existingMapper.id },
                { ...mapperConfig, id: existingMapper.id },
            );
            this.logger.log(`Updated Keycloak role protocol mapper for client '${clientId}'.`);
            return;
        }

        await this.kcAdminClient.clients.addProtocolMapper({ id: clientUuid }, mapperConfig);
        this.logger.log(`Created Keycloak role protocol mapper for client '${clientId}'.`);
    }

    private async persistUserAttributes(
        realm: string,
        userId: string,
        attributes: Record<string, string[]>,
        email?: string,
        profile?: KeycloakUserProfile,
    ): Promise<void> {
        const payload: Record<string, unknown> = { attributes };
        if (email) {
            payload.email = email;
            payload.emailVerified = true;
            payload.username = email;
        }
        if (profile?.firstName) {
            payload.firstName = profile.firstName;
        }
        if (profile?.lastName) {
            payload.lastName = profile.lastName;
        }

        await this.kcAdminClient.users.update({ id: userId, realm }, payload);
    }

    private async ensureUserProfile(
        realm: string,
        userId: string,
        email: string,
        profile?: KeycloakUserProfile,
    ): Promise<void> {
        const user = await this.kcAdminClient.users.findOne({ id: userId, realm });
        if (!user) {
            throw new InternalServerErrorException(`User ${userId} not found in realm ${realm}`);
        }

        const needsUpdate =
            user.email?.trim() !== email ||
            (profile?.firstName && user.firstName?.trim() !== profile.firstName) ||
            (profile?.lastName && user.lastName?.trim() !== profile.lastName) ||
            !user.username?.trim();

        if (!needsUpdate) {
            return;
        }

        await this.kcAdminClient.users.update(
            { id: userId, realm },
            {
                email,
                emailVerified: true,
                username: user.username?.trim() || email,
                enabled: user.enabled ?? true,
                firstName: profile?.firstName ?? user.firstName,
                lastName: profile?.lastName ?? user.lastName,
            },
        );

        const refreshed = await this.kcAdminClient.users.findOne({ id: userId, realm });
        if (refreshed?.email?.trim()) {
            return;
        }

        const token = await this.kcAdminClient.getAccessToken();
        if (!token) {
            throw new InternalServerErrorException('Missing Keycloak admin token while syncing user profile');
        }

        const userUrl = `${this.keycloakUrl}/admin/realms/${realm}/users/${userId}`;
        const response = await fetch(userUrl, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...refreshed,
                email,
                emailVerified: true,
                username: refreshed?.username?.trim() || email,
                enabled: refreshed?.enabled ?? true,
                firstName: profile?.firstName ?? refreshed?.firstName,
                lastName: profile?.lastName ?? refreshed?.lastName,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            this.logger.error(`Failed to sync profile for user ${userId}: ${errorBody}`);
            throw new InternalServerErrorException('User email missing');
        }
    }

    private async verifyPersistedAttributes(
        realm: string,
        userId: string,
        attributes: Record<string, string[]>,
    ): Promise<void> {
        const createdUser = await this.kcAdminClient.users.findOne({ id: userId, realm });
        const missingAttributes = Object.entries(attributes).filter(
            ([attributeName, values]) =>
                !values.some((value) =>
                    this.hasAttributeValue(createdUser?.attributes, attributeName, value),
                ),
        );

        if (missingAttributes.length > 0) {
            const missing = missingAttributes.map(([name]) => name).join(', ');
            throw new InternalServerErrorException(
                `Keycloak did not persist required user attributes: ${missing}`,
            );
        }
    }

    private async authenticateAdmin() {
        this.kcAdminClient.setConfig({ realmName: this.authRealm });

        if (this.adminUsername && this.adminPassword) {
            try {
                await this.authenticateWithAdminPassword();
                return;
            } catch (error) {
                this.logger.warn(
                    `Admin/password auth failed for Keycloak user '${this.adminUsername}'. Trying client credentials fallback.`,
                );
            }
        }

        try {
            await this.kcAdminClient.auth({
                grantType: 'client_credentials',
                clientId: this.clientId,
                clientSecret: this.clientSecret,
            });
            return;
        } catch (error) {
            this.logger.warn(`Client credentials auth failed for Keycloak client '${this.clientId}'.`);
        }

        if (!this.adminUsername || !this.adminPassword) {
            throw new Error(
                `Keycloak authentication failed with client credentials and no KEYCLOAK_ADMIN/KEYCLOAK_ADMIN_PASSWORD fallback is configured.`,
            );
        }

        await this.authenticateWithAdminPassword();
    }

    private async authenticateWithAdminPassword() {
        if (!this.adminUsername || !this.adminPassword) {
            throw new Error('Admin credentials are not configured for Keycloak password grant fallback.');
        }

        this.kcAdminClient.setConfig({ realmName: this.authRealm });
        await this.kcAdminClient.auth({
            grantType: 'password',
            clientId: 'admin-cli',
            username: this.adminUsername,
            password: this.adminPassword,
        });
    }

    private isAuthzError(error: any): boolean {
        const status = error?.response?.status;
        return status === 401 || status === 403;
    }

    private resolveUserEmail(user: { email?: string; username?: string }, emailHint?: string): string | null {
        const candidates = [emailHint, user.email, user.username];
        for (const candidate of candidates) {
            const normalized = candidate?.trim();
            if (normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
                return normalized;
            }
        }
        return null;
    }

    private getActionsEmailClientId(): string {
        const configured = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'cleantrack-client');
        return configured === 'admin-cli' ? 'cleantrack-client' : configured;
    }

    async getUserById(realm: string, userId: string): Promise<Record<string, any> | undefined> {
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });
        return this.kcAdminClient.users.findOne({ id: userId, realm });
    }

    async createUser(
        realm: string,
        email: string,
        attributes: Record<string, any>,
        realmRole?: string,
        profile?: KeycloakUserProfile,
    ): Promise<any> {
        const normalizedAttributes = this.normalizeAttributes(attributes);
        this.logger.log(
            `Creating user ${email} in realm ${realm} with attributes: ${JSON.stringify(normalizedAttributes)}`,
        );

        await this.authenticateAdmin();
        await this.ensureUserProfileAttributes(realm);
        this.kcAdminClient.setConfig({ realmName: realm });

        try {
            const newUser = await this.kcAdminClient.users.create({
                email: email,
                username: email,
                firstName: profile?.firstName,
                lastName: profile?.lastName,
                emailVerified: true,
                enabled: true,
                attributes: normalizedAttributes,
                requiredActions: [RequiredActionAlias.UPDATE_PASSWORD],
            });
            this.logger.log(`User ${email} created successfully. ID: ${newUser.id}`);

            if (newUser.id && Object.keys(normalizedAttributes).length > 0) {
                await this.persistUserAttributes(realm, newUser.id, normalizedAttributes, email, profile);
                await this.verifyPersistedAttributes(realm, newUser.id, normalizedAttributes);
                await this.ensureUserProfile(realm, newUser.id, email, profile);
                this.logger.log(`Persisted custom attributes for user ${email}`);
            }

            if (realmRole && newUser.id) {
                try {
                    await this.assignRealmRoles(realm, newUser.id, getEffectiveRealmRoles(realmRole));
                    this.logger.log(`Assigned realm role(s) for '${realmRole}' to user ${email}`);
                } catch (error) {
                    if (!this.isAuthzError(error) || !this.adminUsername || !this.adminPassword) {
                        throw error;
                    }

                    this.logger.warn(
                        `Role lookup/mapping denied with service-account token. Retrying with admin password grant.`,
                    );
                    await this.authenticateWithAdminPassword();
                    this.kcAdminClient.setConfig({ realmName: realm });

                    await this.assignRealmRoles(realm, newUser.id, getEffectiveRealmRoles(realmRole));
                    this.logger.log(`Assigned realm role(s) for '${realmRole}' to user ${email} after fallback auth`);
                }
            }

            if (newUser.id) {
                const persistedUser = await this.kcAdminClient.users.findOne({
                    id: newUser.id,
                    realm,
                });

                try {
                    await this.sendInvitationEmail(realm, newUser.id, email, profile);
                } catch (inviteError) {
                    this.logger.warn(
                        `User ${email} created but invitation email could not be sent: ${inviteError instanceof Error ? inviteError.message : inviteError}`,
                    );
                }

                return persistedUser ?? newUser;
            }

            return newUser;
        } catch (error) {
            this.logger.error(`Failed to create user ${email} in realm ${realm}`, error);
            throw error;
        }
    }

    async findUsersByAttribute(realm: string, attributeName: string, attributeValue: string): Promise<any[]> {
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });
        const users: any[] = [];
        const batchSize = 100;
        let first = 0;

        while (true) {
            const batch = await this.kcAdminClient.users.find({
                realm,
                first,
                max: batchSize,
                briefRepresentation: false,
            });
            if (!batch.length) {
                break;
            }

            users.push(...batch);
            if (batch.length < batchSize) {
                break;
            }
            first += batchSize;
        }

        const attributeAliases: Record<string, string[]> = {
            tenant_id: ['tenant_id', 'tenantId'],
            site_ids: ['site_ids', 'siteIds'],
        };
        const candidateKeys = attributeAliases[attributeName] ?? [attributeName];

        return users.filter((user) => {
            for (const key of candidateKeys) {
                const attrValue = user?.attributes?.[key];
                if (Array.isArray(attrValue) && attrValue.includes(attributeValue)) {
                    return true;
                }
                if (typeof attrValue === 'string' && attrValue === attributeValue) {
                    return true;
                }
            }
            return false;
        });
    }

    async resendInvitationEmail(
        realm: string,
        userId: string,
        actions: string[] = [RequiredActionAlias.UPDATE_PASSWORD],
        emailHint?: string,
        profile?: KeycloakUserProfile,
    ): Promise<void> {
        await this.sendInvitationEmail(realm, userId, emailHint, profile, actions);
    }

    private async sendInvitationEmail(
        realm: string,
        userId: string,
        emailHint?: string,
        profile?: KeycloakUserProfile,
        actions: string[] = [RequiredActionAlias.UPDATE_PASSWORD],
    ): Promise<void> {
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });

        const user = await this.kcAdminClient.users.findOne({ id: userId, realm });
        if (!user) {
            throw new InternalServerErrorException(`User ${userId} not found in realm ${realm}`);
        }

        const email = this.resolveUserEmail(user, emailHint);
        if (!email) {
            throw new InternalServerErrorException('User email missing');
        }

        await this.ensureUserProfile(realm, userId, email, profile);

        const requiredActions = Array.isArray(user.requiredActions) ? [...user.requiredActions] : [];
        if (!requiredActions.includes(RequiredActionAlias.UPDATE_PASSWORD)) {
            await this.kcAdminClient.users.update(
                { id: userId, realm },
                { requiredActions: [...requiredActions, RequiredActionAlias.UPDATE_PASSWORD] },
            );
        }

        const redirectUri = this.getActionsEmailRedirectUri();
        try {
            await this.kcAdminClient.users.executeActionsEmail({
                id: userId,
                realm,
                actions,
                clientId: this.getActionsEmailClientId(),
                ...(redirectUri ? { redirectUri } : {}),
            });
        } catch (error) {
            // Invalid redirect_uri (not whitelisted on the client) must not block invites.
            if (!redirectUri) {
                throw error;
            }
            this.logger.warn(
                `executeActionsEmail with redirectUri=${redirectUri} failed; retrying without redirectUri: ${
                    error instanceof Error ? error.message : error
                }`,
            );
            await this.kcAdminClient.users.executeActionsEmail({
                id: userId,
                realm,
                actions,
                clientId: this.getActionsEmailClientId(),
            });
        }
    }

    /** App sign-in page — starts a fresh OIDC flow (never url.loginUrl after required actions). */
    private getActionsEmailRedirectUri(): string | undefined {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL')?.trim();
        if (!frontendUrl) {
            return undefined;
        }
        return `${frontendUrl.replace(/\/+$/, '')}/auth/signin`;
    }

    async deleteUser(realm: string, userId: string): Promise<void> {
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });
        await this.kcAdminClient.users.del({ id: userId, realm });
    }

    async updateUser(
        realm: string,
        userId: string,
        updates: { attributes?: Record<string, string[]>; role?: string; enabled?: boolean },
    ): Promise<void> {
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });

        const patch: { attributes?: Record<string, string[]>; enabled?: boolean } = {};
        if (updates.attributes) {
            patch.attributes = updates.attributes;
        }
        if (updates.enabled !== undefined) {
            patch.enabled = updates.enabled;
        }

        if (Object.keys(patch).length) {
            await this.kcAdminClient.users.update({ id: userId, realm }, patch);
        }

        if (updates.role) {
            await this.updateUserRealmRole(realm, userId, updates.role);
        }
    }

    /**
     * Enable/disable every Keycloak user belonging to a tenant, and revoke
     * active SSO sessions when disabling so existing tokens stop refreshing.
     */
    async setTenantUsersEnabled(realm: string, tenantId: string, enabled: boolean): Promise<number> {
        const users = await this.findUsersByAttribute(realm, 'tenant_id', tenantId);
        let updated = 0;

        for (const user of users) {
            if (!user?.id) continue;
            if (user.enabled === enabled) {
                if (!enabled) {
                    try {
                        await this.kcAdminClient.users.logout({ id: user.id, realm });
                    } catch (error) {
                        this.logger.warn(
                            `Failed to logout sessions for user ${user.id} on tenant ${tenantId}: ${
                                error instanceof Error ? error.message : String(error)
                            }`,
                        );
                    }
                }
                continue;
            }

            try {
                await this.updateUser(realm, user.id, { enabled });
                if (!enabled) {
                    await this.kcAdminClient.users.logout({ id: user.id, realm });
                }
                updated += 1;
            } catch (error) {
                this.logger.error(
                    `Failed to set enabled=${enabled} for user ${user.id} (tenant ${tenantId})`,
                    error,
                );
            }
        }

        this.logger.log(
            `Tenant ${tenantId}: ${enabled ? 'enabled' : 'disabled'} ${updated}/${users.length} Keycloak user(s)`,
        );
        return updated;
    }

    private async assignRealmRoles(realm: string, userId: string, roleNames: string[]): Promise<void> {
        const rolesToAdd: { id: string; name: string }[] = [];

        for (const roleName of roleNames) {
            const role = await this.kcAdminClient.roles.findOneByName({ name: roleName, realm });
            if (role?.id && role.name) {
                rolesToAdd.push({ id: role.id, name: role.name });
            } else {
                this.logger.warn(`Realm role '${roleName}' not found; skipping assignment`);
            }
        }

        if (rolesToAdd.length) {
            await this.kcAdminClient.users.addRealmRoleMappings({
                id: userId,
                realm,
                roles: rolesToAdd,
            });
        }
    }

    private async updateUserRealmRole(realm: string, userId: string, newRole: string): Promise<void> {
        const currentRoles = await this.kcAdminClient.users.listRealmRoleMappings({ id: userId, realm });
        const rolesToRemove = currentRoles.filter((role) => role.name && APP_REALM_ROLES.includes(role.name as typeof APP_REALM_ROLES[number]));

        if (rolesToRemove.length) {
            await this.kcAdminClient.users.delRealmRoleMappings({
                id: userId,
                realm,
                roles: rolesToRemove.map((role) => ({ id: role.id!, name: role.name! })),
            });
        }

        await this.assignRealmRoles(realm, userId, getEffectiveRealmRoles(newRole));
    }

    async createRealm(realmName: string): Promise<void> {
        this.logger.log(`Attempting to create Realm: ${realmName} at ${this.keycloakUrl}`);
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: this.authRealm });

        try {
            await this.kcAdminClient.realms.create({
                id: realmName,
                realm: realmName,
                enabled: true,
                loginTheme: 'cleantrack-pro',
                accountTheme: 'cleantrack-pro',
                emailTheme: 'cleantrack-pro',
                internationalizationEnabled: true,
                supportedLocales: ['fr', 'en'],
                defaultLocale: 'fr',
            });
            this.logger.log(`[SUCCESS] Realm ${realmName} created.`);
        } catch (error) {
            if (error.response?.status === 409) {
                this.logger.log(`Realm ${realmName} already exists.`);
            } else if (this.isAuthzError(error) && this.adminUsername && this.adminPassword) {
                this.logger.warn(
                    `Realm creation denied with current token (status ${error.response?.status}). Retrying with explicit admin password grant.`,
                );
                await this.authenticateWithAdminPassword();
                this.kcAdminClient.setConfig({ realmName: this.authRealm });
                await this.kcAdminClient.realms.create({
                    id: realmName,
                    realm: realmName,
                    enabled: true,
                    loginTheme: 'cleantrack-pro',
                    accountTheme: 'cleantrack-pro',
                    emailTheme: 'cleantrack-pro',
                    internationalizationEnabled: true,
                    supportedLocales: ['fr', 'en'],
                    defaultLocale: 'fr',
                });
                this.logger.log(`[SUCCESS] Realm ${realmName} created after fallback auth.`);
            } else {
                this.logger.error(`Failed to create realm ${realmName}`, error);
                throw error;
            }
        }
    }

    async createClient(realmName: string, clientName: string): Promise<void> {
        this.logger.log(`Attempting to create Client: ${clientName} in Realm: ${realmName}`);
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realmName });

        try {
            await this.kcAdminClient.clients.create({
                clientId: clientName,
                enabled: true,
                standardFlowEnabled: true,
                directAccessGrantsEnabled: true,
                rootUrl: 'http://localhost:3000', // Default for dev
                webOrigins: ['*'],
            });
            this.logger.log(`[SUCCESS] Client ${clientName} created in ${realmName}.`);
        } catch (error) {
            if (error.response?.status === 409) {
                this.logger.log(`Client ${clientName} already exists in ${realmName}.`);
            } else {
                this.logger.error(`Failed to create client ${clientName} in ${realmName}`, error);
                throw error;
            }
        }
    }
}
