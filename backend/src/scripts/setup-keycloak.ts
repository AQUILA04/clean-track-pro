import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cleantrack-client';
const CLEANTRACK_THEME = 'cleantrack-pro';

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
                loginTheme: CLEANTRACK_THEME,
                accountTheme: CLEANTRACK_THEME,
                emailTheme: CLEANTRACK_THEME,
                internationalizationEnabled: true,
                supportedLocales: ['fr', 'en'],
                defaultLocale: 'fr',
            });
            console.log(`✅ Created realm '${REALM_NAME}'`);
        }

        // Switch to the new realm
        kcAdminClient.setConfig({ realmName: REALM_NAME });

        await kcAdminClient.realms.update(
            { realm: REALM_NAME },
            {
                displayName: 'CleanTrack Pro',
                loginTheme: CLEANTRACK_THEME,
                accountTheme: CLEANTRACK_THEME,
                emailTheme: CLEANTRACK_THEME,
                internationalizationEnabled: true,
                supportedLocales: ['fr', 'en'],
                defaultLocale: 'fr',
            },
        );
        console.log(`✅ Theme '${CLEANTRACK_THEME}' applied to realm '${REALM_NAME}'`);

        // Create client
        const clients = await kcAdminClient.clients.find({ clientId: CLIENT_ID });
        let clientUuid: string;

        if (clients.length > 0) {
            console.log(`ℹ️  Client '${CLIENT_ID}' already exists`);
            clientUuid = clients[0].id!;
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
                    'http://localhost:3000/auth/signin',
                    'http://localhost:3000/api/auth/callback/keycloak',
                    'http://localhost:3001/*',
                    'http://localhost:3001/auth/signin',
                    'http://localhost:3001/api/auth/callback/keycloak',
                ],
                webOrigins: ['http://localhost:3000', 'http://localhost:3001'],
                protocol: 'openid-connect',
                rootUrl: 'http://localhost:3001',
                baseUrl: 'http://localhost:3001/auth/signin',
                attributes: {
                    'post.logout.redirect.uris': [
                        'http://localhost:3000/',
                        'http://localhost:3000/*',
                        'http://localhost:3001/',
                        'http://localhost:3001/*',
                    ].join('##'),
                },
            });
            clientUuid = client.id;
            console.log(`✅ Created client '${CLIENT_ID}'`);
        }

        const existingClient = await kcAdminClient.clients.findOne({ id: clientUuid });
        await kcAdminClient.clients.update(
            { id: clientUuid },
            {
                ...existingClient,
                rootUrl: 'http://localhost:3001',
                baseUrl: 'http://localhost:3001/auth/signin',
                redirectUris: Array.from(
                    new Set([
                        ...(existingClient?.redirectUris ?? []),
                        'http://localhost:3000/*',
                        'http://localhost:3000/auth/signin',
                        'http://localhost:3000/api/auth/callback/keycloak',
                        'http://localhost:3001/*',
                        'http://localhost:3001/auth/signin',
                        'http://localhost:3001/api/auth/callback/keycloak',
                    ]),
                ),
                webOrigins: Array.from(
                    new Set([...(existingClient?.webOrigins ?? []), 'http://localhost:3000', 'http://localhost:3001']),
                ),
                attributes: {
                    ...(existingClient?.attributes ?? {}),
                    'post.logout.redirect.uris': [
                        'http://localhost:3000/',
                        'http://localhost:3000/*',
                        'http://localhost:3001/',
                        'http://localhost:3001/*',
                    ].join('##'),
                },
            },
        );
        console.log(`✅ Post-logout redirect URIs configured for client '${CLIENT_ID}'`);

        // Create protocol mappers for tenant_id and site_ids
        const mappers = await kcAdminClient.clients.listProtocolMappers({
            id: clientUuid,
        });

        // Fixed implicit any error by specifying type or just letting it be inferred (mappers are typed in library usually)
        // But the error was "Parameter 'm' implicitly has an 'any' type".
        // I will add explicit type if possible, or just ignore. Types are usually inferred. 
        // Let's add (m: any) to be safe given the previous error.

        const tenantIdMapper = mappers.find((m: any) => m.name === 'tenant_id');
        if (!tenantIdMapper) {
            await kcAdminClient.clients.addProtocolMapper(
                { id: clientUuid },
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
                    },
                }
            );
            console.log('✅ Created tenant_id mapper');
        }

        const siteIdsMapper = mappers.find((m: any) => m.name === 'site_ids');
        if (!siteIdsMapper) {
            await kcAdminClient.clients.addProtocolMapper(
                { id: clientUuid },
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
                        multivalued: 'true',
                    },
                }
            );
            console.log('✅ Created site_ids mapper');
        }

        const roleMapper = mappers.find((m: any) => m.name === 'role');
        if (!roleMapper) {
            await kcAdminClient.clients.addProtocolMapper(
                { id: clientUuid },
                {
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
                    },
                }
            );
            console.log('✅ Created role mapper');
        }

        // Create roles
        const roles = ['Superadmin', 'Admin_Tenant', 'Admin_Site', 'User_Site', 'Livreur'];
        for (const roleName of roles) {
            try {
                await kcAdminClient.roles.findOneByName({ name: roleName });
                console.log(`ℹ️  Role '${roleName}' already exists`);
            } catch {
                await kcAdminClient.roles.create({ name: roleName });
                console.log(`✅ Created role '${roleName}'`);
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
            });

            let userId: string;
            if (existingUsers.length > 0) {
                console.log(`ℹ️  User '${userData.username}' already exists`);
                userId = existingUsers[0].id!;
            } else {
                const user = await kcAdminClient.users.create({
                    username: userData.username,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    enabled: true,
                    emailVerified: true,
                    attributes: userData.attributes,
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
                });
            }

            // Assign roles
            for (const roleName of userData.roles) {
                const role = await kcAdminClient.roles.findOneByName({
                    name: roleName,
                });
                if (role) {
                    await kcAdminClient.users.addRealmRoleMappings({
                        id: userId,
                        roles: [{ id: role.id!, name: role.name! }],
                    });
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
