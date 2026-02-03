import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cleantrack-client';

const requiredEnvVars = [
    { name: 'KEYCLOAK_URL', val: KEYCLOAK_URL },
    { name: 'KEYCLOAK_ADMIN', val: KEYCLOAK_ADMIN },
    { name: 'KEYCLOAK_ADMIN_PASSWORD', val: KEYCLOAK_ADMIN_PASSWORD },
    { name: 'KEYCLOAK_REALM', val: REALM_NAME },
    { name: 'KEYCLOAK_CLIENT_ID', val: CLIENT_ID },
];

requiredEnvVars.forEach((v) => {
    if (!v.val) {
        console.warn(`⚠️  Warning: ${v.name} is using a hardcoded default or empty value.`);
    }
});

async function setupKeycloak() {
    console.log('🔧 Setting up Keycloak...');

    const kcAdminClient = new KcAdminClient({
        baseUrl: KEYCLOAK_URL,
        realmName: 'master',
    });

    try {
        // Authenticate as admin
        await kcAdminClient.auth({
            username: KEYCLOAK_ADMIN,
            password: KEYCLOAK_ADMIN_PASSWORD,
            grantType: 'password',
            clientId: 'admin-cli',
        });

        console.log('✅ Authenticated with Keycloak');

        // Create realm if it doesn't exist
        try {
            const realm = await kcAdminClient.realms.findOne({ realm: REALM_NAME });
            if (!realm) {
                throw new Error('Realm not found');
            }
            console.log(`ℹ️  Realm '${REALM_NAME}' already exists`);
        } catch (e) {
            console.log(`ℹ️  Realm '${REALM_NAME}' not found, creating...`);
            await kcAdminClient.realms.create({
                realm: REALM_NAME,
                enabled: true,
                displayName: 'CleanTrack Pro',
            });
            console.log(`✅ Created realm '${REALM_NAME}'`);
        }

        // Switch to the new realm
        kcAdminClient.setConfig({ realmName: REALM_NAME });

        // Create client
        const clients = await kcAdminClient.clients.find({ clientId: CLIENT_ID });
        let clientUuid: string;

        if (clients.length > 0) {
            console.log(`ℹ️  Client '${CLIENT_ID}' already exists, updating configuration...`);
            clientUuid = clients[0].id!;

            // Update existing client to ensure redirects are correct
            await kcAdminClient.clients.update({ id: clientUuid }, {
                redirectUris: [
                    'http://localhost:3000/*',
                    'http://localhost:3000/api/auth/callback/keycloak',
                    'http://localhost:3001/*',
                    'http://localhost:3001/api/auth/callback/keycloak',
                ],
                webOrigins: ['http://localhost:3000', 'http://localhost:3001'],
                standardFlowEnabled: true,
                directAccessGrantsEnabled: true,
                serviceAccountsEnabled: true,
            });
            console.log(`✅ Updated client '${CLIENT_ID}' configuration`);
        } else {
            const client = await kcAdminClient.clients.create({
                clientId: CLIENT_ID,
                enabled: true,
                publicClient: false,
                standardFlowEnabled: true,
                directAccessGrantsEnabled: true,
                serviceAccountsEnabled: true,
                redirectUris: [
                    'http://localhost:3000/*',
                    'http://localhost:3000/api/auth/callback/keycloak',
                    'http://localhost:3001/*',
                    'http://localhost:3001/api/auth/callback/keycloak',
                ],
                webOrigins: ['http://localhost:3000', 'http://localhost:3001'],
                protocol: 'openid-connect',
            });
            clientUuid = client.id;
            console.log(`✅ Created client '${CLIENT_ID}'`);
        }

        // Create or Update protocol mappers
        const mappers = await kcAdminClient.clients.listProtocolMappers({
            id: clientUuid,
        });

        const mappersToSync = [
            {
                name: 'tenant_id',
                protocol: 'openid-connect',
                protocolMapper: 'oidc-usermodel-attribute-mapper',
                config: {
                    'user.attribute': 'tenant_id',
                    'claim.name': 'tenant_id',
                    'jsonType.label': 'String',
                    'id.token.claim': 'true',
                    'access.token.claim': 'true',
                    'userinfo.token.claim': 'true',
                    'aggregate.attrs': 'true'
                },
            },
            {
                name: 'site_ids',
                protocol: 'openid-connect',
                protocolMapper: 'oidc-usermodel-attribute-mapper',
                config: {
                    'user.attribute': 'site_ids',
                    'claim.name': 'site_ids',
                    'jsonType.label': 'String',
                    'id.token.claim': 'true',
                    'access.token.claim': 'true',
                    'userinfo.token.claim': 'true',
                    'multivalued': 'true',
                },
            },
            {
                name: 'audience-mapper',
                protocol: 'openid-connect',
                protocolMapper: 'oidc-audience-mapper',
                config: {
                    'included.client.audience': CLIENT_ID,
                    'id.token.claim': 'true',
                    'access.token.claim': 'true',
                },
            }
        ];

        for (const mapperConfig of mappersToSync) {
            const existingMapper = mappers.find((m: any) => m.name === mapperConfig.name);
            if (existingMapper) {
                console.log(`ℹ️ Updating existing mapper: ${mapperConfig.name}`);
                await kcAdminClient.clients.updateProtocolMapper(
                    { id: clientUuid, mapperId: existingMapper.id! },
                    {
                        ...mapperConfig,
                        id: existingMapper.id,
                    }
                );
            } else {
                console.log(`Platform: Creating mapper: ${mapperConfig.name}`);
                await kcAdminClient.clients.addProtocolMapper(
                    { id: clientUuid },
                    mapperConfig
                );
            }
        }

        // Get and print Client Secret
        const secretStruct = await kcAdminClient.clients.getClientSecret({ id: clientUuid });
        const clientSecret = secretStruct.value;
        console.log(`\n🔑 Client Secret: ${clientSecret}`);

        // Create roles
        const roles = ['Superadmin', 'Admin_Tenant', 'Admin_Site', 'User_Site'];
        for (const roleName of roles) {
            try {
                // IMPORTANT: findOneByName might return null instead of throwing, so check the result!
                const existingRole = await kcAdminClient.roles.findOneByName({ name: roleName, realm: REALM_NAME });
                if (existingRole) {
                    console.log(`ℹ️  Role '${roleName}' already exists in realm '${REALM_NAME}'`);
                } else {
                    // Throw to trigger catch block for creation, or just create here.
                    throw new Error('Role not found');
                }
            } catch {
                await kcAdminClient.roles.create({ name: roleName, realm: REALM_NAME });
                console.log(`✅ Created role '${roleName}' in realm '${REALM_NAME}'`);
            }
        }

        // Create test users
        const testUsers = [
            {
                username: 'superadmin',
                email: 'superadmin@cleantrack.local',
                firstName: 'Super',
                lastName: 'Admin',
                roles: ['Superadmin'],
                attributes: {},
            },
            {
                username: 'admin_tenant',
                email: 'admin@tenant1.local',
                firstName: 'Tenant',
                lastName: 'Admin',
                roles: ['Admin_Tenant'],
                attributes: {
                    tenant_id: ['550e8400-e29b-41d4-a716-446655440001'],
                },
            },
        ];

        for (const userData of testUsers) {
            const existingUsers = await kcAdminClient.users.find({
                username: userData.username,
                realm: REALM_NAME
            });

            let userId: string;
            if (existingUsers.length > 0) {
                console.log(`ℹ️  User '${userData.username}' already exists. Deleting and recreating...`);
                await kcAdminClient.users.del({ id: existingUsers[0].id!, realm: REALM_NAME });
            }

            // Create user
            const user = await kcAdminClient.users.create({
                username: userData.username,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                enabled: true,
                emailVerified: true,
                realm: REALM_NAME
            });
            userId = user.id;
            console.log(`✅ Created user '${userData.username}'`);

            // Set password
            await kcAdminClient.users.resetPassword({
                id: userId,
                credential: {
                    temporary: false,
                    type: 'password',
                    value: 'password123',
                },
                realm: REALM_NAME
            });

            // GROUP ASSIGNMENT STRATEGY (Fix for missing attributes)
            if (userData.attributes?.tenant_id) {
                const groupName = `TenantGroup_${userData.username}`;
                console.log(`Creating Group '${groupName}' for attributes...`);

                // 1. Create Group with Attributes
                const group = await kcAdminClient.groups.create({
                    name: groupName,
                    attributes: userData.attributes, // Assign attributes to Group
                    realm: REALM_NAME
                });

                // 2. Add User to Group
                await kcAdminClient.users.addToGroup({
                    id: userId,
                    groupId: group.id!,
                    realm: REALM_NAME
                });
                console.log(`✅ Assigned user '${userData.username}' to group '${groupName}' (with attributes)`);
            }

            // Assign roles (Realm and Client)
            for (const roleName of userData.roles) {
                try {
                    // 1. Assign Realm Role
                    console.log(`🔍 Finding Realm role '${roleName}'...`);
                    const realmRole = await kcAdminClient.roles.findOneByName({
                        name: roleName,
                        realm: REALM_NAME
                    });

                    if (realmRole) {
                        await kcAdminClient.users.addRealmRoleMappings({
                            id: userId,
                            realm: REALM_NAME,
                            roles: [{ id: realmRole.id!, name: realmRole.name! }],
                        });
                        console.log(`✅ Assigned Realm role '${roleName}' to user '${userData.username}'`);
                    } else {
                        console.error(`❌ Realm Role '${roleName}' not found!`);
                    }

                    // 2. Create and Assign Client Role
                    console.log(`🔍 Processing Client role '${roleName}' for client '${CLIENT_ID}'...`);

                    // Check if client role exists
                    let clientLevelRole = await kcAdminClient.clients.findRole({
                        id: clientUuid,
                        roleName: roleName
                    }).catch(() => null);

                    if (!clientLevelRole) {
                        try {
                            // Syntax might vary, trying flattened object based on error message
                            await kcAdminClient.clients.createRole({
                                id: clientUuid,
                                name: roleName
                            });
                            console.log(`✅ Created Client role '${roleName}'`);

                            // Fetch again to get ID
                            clientLevelRole = await kcAdminClient.clients.findRole({
                                id: clientUuid,
                                roleName: roleName
                            });
                        } catch (e) {
                            console.log(`ℹ️ Client role '${roleName}' creation skipped (error: ${e.message})`);
                        }
                    }

                    if (clientLevelRole) {
                        await kcAdminClient.users.addClientRoleMappings({
                            id: userId,
                            clientUniqueId: clientUuid,
                            roles: [{ id: clientLevelRole.id!, name: clientLevelRole.name! }],
                        });
                        console.log(`✅ Assigned Client role '${roleName}' to user '${userData.username}'`);
                    }

                } catch (err) {
                    console.error(`❌ Failed to process role '${roleName}' for user '${userData.username}':`, err);
                }
            }
        }

        console.log('✅ Keycloak setup complete!');
        console.log(`\n📝 Configuration:`);
        console.log(`   Realm: ${REALM_NAME}`);
        console.log(`   Client ID: ${CLIENT_ID}`);
        console.log(`   Test users:`);
        console.log(`     - superadmin / password123`);
        console.log(`     - admin_tenant / password123`);
    } catch (error) {
        console.error('❌ Error setting up Keycloak:', error);
        process.exit(1);
    }
}

setupKeycloak();
