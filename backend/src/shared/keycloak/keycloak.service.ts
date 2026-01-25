
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { RequiredActionAlias } from '@keycloak/keycloak-admin-client/lib/defs/requiredActionProviderRepresentation';

@Injectable()
export class KeycloakService implements OnModuleInit {
    private readonly logger = new Logger(KeycloakService.name);
    private readonly kcAdminClient: KcAdminClient;
    private readonly keycloakUrl: string;
    private readonly realm: string;
    private readonly clientId: string;
    private readonly clientSecret: string;

    constructor(private configService: ConfigService) {
        this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'http://localhost:8080');
        this.realm = this.configService.get<string>('KEYCLOAK_REALM', 'master');
        this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID', 'admin-cli');
        this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET', 'admin-cli-secret');

        this.kcAdminClient = new KcAdminClient({
            baseUrl: this.keycloakUrl,
            realmName: this.realm,
        });
    }

    async onModuleInit() {
        try {
            await this.authenticateAdmin();
        } catch (error) {
            this.logger.warn(`Failed to connect to Keycloak at startup: ${error.message}. Integration might be degraded.`);
        }
    }

    private async authenticateAdmin() {
        await this.kcAdminClient.auth({
            grantType: 'client_credentials',
            clientId: this.clientId,
            clientSecret: this.clientSecret,
        });
    }

    async createUser(realm: string, email: string, attributes: Record<string, any>): Promise<any> {
        this.logger.log(`Creating user ${email} in realm ${realm} with attributes: ${JSON.stringify(attributes)}`);

        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });

        try {
            const newUser = await this.kcAdminClient.users.create({
                email: email,
                username: email,
                emailVerified: true,
                enabled: true,
                attributes: attributes,
                requiredActions: [RequiredActionAlias.UPDATE_PASSWORD],
            });
            this.logger.log(`User ${email} created successfully. ID: ${newUser.id}`);
            return newUser;
        } catch (error) {
            this.logger.error(`Failed to create user ${email} in realm ${realm}`, error);
            throw error;
        }
    }

    async findUsersByAttribute(realm: string, attributeName: string, attributeValue: string): Promise<any[]> {
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: realm });

        return this.kcAdminClient.users.find({
            q: `${attributeName}:${attributeValue}`,
            realm: realm
        });
    }

    async createRealm(realmName: string): Promise<void> {
        this.logger.log(`Attempting to create Realm: ${realmName} at ${this.keycloakUrl}`);
        await this.authenticateAdmin();
        this.kcAdminClient.setConfig({ realmName: 'master' });

        try {
            await this.kcAdminClient.realms.create({
                id: realmName,
                realm: realmName,
                enabled: true,
            });
            this.logger.log(`[SUCCESS] Realm ${realmName} created.`);
        } catch (error) {
            if (error.response?.status === 409) {
                this.logger.log(`Realm ${realmName} already exists.`);
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
