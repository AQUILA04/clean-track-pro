import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cleantrack-client';
const CLEANTRACK_THEME = 'cleantrack-pro';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const KEYCLOAK_SMTP_HOST = process.env.KEYCLOAK_SMTP_HOST;
const KEYCLOAK_SMTP_PORT = process.env.KEYCLOAK_SMTP_PORT || '1025';
const KEYCLOAK_SMTP_FROM = process.env.KEYCLOAK_SMTP_FROM;
const KEYCLOAK_SMTP_FROM_DISPLAY_NAME =
    process.env.KEYCLOAK_SMTP_FROM_DISPLAY_NAME || 'Support CleanTrackPro';
const KEYCLOAK_SMTP_REPLY_TO = process.env.KEYCLOAK_SMTP_REPLY_TO || KEYCLOAK_SMTP_FROM;
const KEYCLOAK_SMTP_REPLY_TO_DISPLAY_NAME =
    process.env.KEYCLOAK_SMTP_REPLY_TO_DISPLAY_NAME || KEYCLOAK_SMTP_FROM_DISPLAY_NAME;
const LEGACY_FRONTEND_URLS = (process.env.EXTRA_FRONTEND_URLS || 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

function buildRedirectUris(): string[] {
    const frontendUrls = [FRONTEND_URL, ...LEGACY_FRONTEND_URLS.filter((url) => url !== FRONTEND_URL)];
    const uris = new Set<string>();

    for (const baseUrl of frontendUrls) {
        uris.add(`${baseUrl}/*`);
        uris.add(`${baseUrl}/auth/signin`);
        uris.add(`${baseUrl}/api/auth/callback/keycloak`);
    }

    return Array.from(uris);
}

function buildWebOrigins(): string[] {
    return Array.from(new Set([FRONTEND_URL, ...LEGACY_FRONTEND_URLS]));
}

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

        if (KEYCLOAK_SMTP_HOST && KEYCLOAK_SMTP_FROM) {
            await kcAdminClient.realms.update(
                { realm: REALM_NAME },
                {
                    smtpServer: {
                        host: KEYCLOAK_SMTP_HOST,
                        port: KEYCLOAK_SMTP_PORT,
                        from: KEYCLOAK_SMTP_FROM,
                        fromDisplayName: KEYCLOAK_SMTP_FROM_DISPLAY_NAME,
                        replyTo: KEYCLOAK_SMTP_REPLY_TO,
                        replyToDisplayName: KEYCLOAK_SMTP_REPLY_TO_DISPLAY_NAME,
                        ssl: 'false',
                        starttls: 'false',
                        auth: 'false',
                    },
                },
            );
            console.log(
                `✅ SMTP configured (${KEYCLOAK_SMTP_HOST}:${KEYCLOAK_SMTP_PORT}, from ${KEYCLOAK_SMTP_FROM})`,
            );
        } else {
            console.log('ℹ️  SMTP not configured (set KEYCLOAK_SMTP_HOST and KEYCLOAK_SMTP_FROM)');
        }

        // Create client
        const clients = await kcAdminClient.clients.find({ clientId: CLIENT_ID });
        let clientUuid: string;

        if (clients.length > 0) {
            console.log(`ℹ️  Client '${CLIENT_ID}' already exists, updating configuration...`);
            clientUuid = clients[0].id!;

            // Update existing client to ensure redirects are correct
            await kcAdminClient.clients.update({ id: clientUuid }, {
                rootUrl: FRONTEND_URL,
                baseUrl: `${FRONTEND_URL.replace(/\/+$/, '')}/auth/signin`,
                redirectUris: buildRedirectUris(),
                webOrigins: buildWebOrigins(),
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
                rootUrl: FRONTEND_URL,
                baseUrl: `${FRONTEND_URL.replace(/\/+$/, '')}/auth/signin`,
                redirectUris: buildRedirectUris(),
                webOrigins: buildWebOrigins(),
                protocol: 'openid-connect',
            });
            clientUuid = client.id;
            console.log(`✅ Created client '${CLIENT_ID}'`);
        }

        console.log('\n🧩 Configuring Keycloak user profile attributes...');
        const profileUrl = `${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/profile`;
        const profileResponse = await fetch(profileUrl, {
            headers: {
                Authorization: `Bearer ${await kcAdminClient.getAccessToken()}`,
                'Content-Type': 'application/json',
            },
        });

        if (profileResponse.ok) {
            const profile = await profileResponse.json();
            const customAttributes = [
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
            const existingNames = new Set((profile.attributes ?? []).map((attr: any) => attr.name));
            for (const attribute of customAttributes) {
                if (!existingNames.has(attribute.name)) {
                    profile.attributes = [...(profile.attributes ?? []), attribute];
                }
            }
            profile.unmanagedAttributePolicy = 'ADMIN_EDIT';

            await fetch(profileUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${await kcAdminClient.getAccessToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profile),
            });
            console.log('✅ User profile attributes configured (tenant_id, site_ids, role)');
        } else {
            console.warn(`⚠️  Could not configure user profile (status ${profileResponse.status})`);
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

        // --- GRANT SERVICE ACCOUNT PERMISSIONS (Fix for 403 Forbidden) ---
        console.log(`\n👮 Configuring Service Account Permissions...`);
        try {
            // 1. Get Service Account User
            const serviceAccountUser = await kcAdminClient.clients.getServiceAccountUser({
                id: clientUuid,
            });
            console.log(`   Service Account User ID: ${serviceAccountUser.id}`);

            // 2. Find 'realm-management' client
            const realmManagementClients = await kcAdminClient.clients.find({ clientId: 'realm-management' });
            if (realmManagementClients.length > 0) {
                const realmManagementId = realmManagementClients[0].id!;

                // 3. Find roles to assign
                const rolesToAssign = ['view-users', 'query-users', 'manage-users'];
                const availableRoles = await kcAdminClient.clients.listRoles({ id: realmManagementId });
                const roles = availableRoles.filter(r => rolesToAssign.includes(r.name!));

                if (roles.length > 0) {
                    // 4. Assign roles
                    await kcAdminClient.users.addClientRoleMappings({
                        id: serviceAccountUser.id!,
                        clientUniqueId: realmManagementId,
                        roles: roles.map(r => ({
                            id: r.id!,
                            name: r.name!,
                        })),
                    });
                    console.log(`✅ Granted roles to Service Account: ${roles.map(r => r.name).join(', ')}`);
                } else {
                    console.warn(`⚠️  Could not find roles to assign: ${rolesToAssign.join(', ')}`);
                }
            } else {
                console.warn(`⚠️  'realm-management' client not found! Cannot assign permissions.`);
            }

        } catch (error) {
            console.error(`❌ Failed to configure Service Account permissions:`, error);
        }
        // ------------------------------------------------------------------

        // Optionally force a known secret (docker-compose.dev / local stacks)
        const desiredSecret = process.env.KEYCLOAK_CLIENT_SECRET;
        if (desiredSecret) {
            await kcAdminClient.clients.update(
                { id: clientUuid },
                { secret: desiredSecret },
            );
            console.log('\n🔑 Client secret set from KEYCLOAK_CLIENT_SECRET');
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
                    role: ['Admin_Tenant'],
                },
            },
            {
                username: 'admin_site',
                email: 'admin.site@tenant1.local',
                firstName: 'Agency',
                lastName: 'Admin',
                roles: ['Admin_Site'],
                attributes: {
                    tenant_id: ['550e8400-e29b-41d4-a716-446655440001'],
                    site_ids: ['660e8400-e29b-41d4-a716-446655440001'],
                    role: ['Admin_Site'],
                },
            },
            {
                username: 'user_site',
                email: 'user.site@tenant1.local',
                firstName: 'Agency',
                lastName: 'Operator',
                roles: ['User_Site'],
                attributes: {
                    tenant_id: ['550e8400-e29b-41d4-a716-446655440001'],
                    site_ids: ['660e8400-e29b-41d4-a716-446655440001'],
                    role: ['User_Site'],
                },
            },
        ];

        for (const userData of testUsers) {
            // Keycloak username search is a substring match unless filtered exactly.
            const found = await kcAdminClient.users.find({
                username: userData.username,
                realm: REALM_NAME,
                exact: true,
            });
            const existing = found.find(
                (u) => (u.username || '').toLowerCase() === userData.username.toLowerCase(),
            );

            let userId: string;
            if (existing?.id) {
                userId = existing.id;
                console.log(`ℹ️  User '${userData.username}' already exists. Updating...`);
                await kcAdminClient.users.update(
                    { id: userId, realm: REALM_NAME },
                    {
                        email: userData.email,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        enabled: true,
                        emailVerified: true,
                        requiredActions: [],
                        attributes: userData.attributes,
                    },
                );
                console.log(`✅ Updated user '${userData.username}'`);
            } else {
                const user = await kcAdminClient.users.create({
                    username: userData.username,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    enabled: true,
                    emailVerified: true,
                    requiredActions: [],
                    attributes: userData.attributes,
                    realm: REALM_NAME,
                });
                userId = user.id;
                console.log(`✅ Created user '${userData.username}'`);
            }

            if (Object.keys(userData.attributes ?? {}).length > 0) {
                await kcAdminClient.users.update(
                    { id: userId, realm: REALM_NAME },
                    { attributes: userData.attributes },
                );
                console.log(`✅ Persisted user attributes for '${userData.username}'`);
            }

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
        console.log(`     - admin_site / password123`);
        console.log(`     - user_site / password123`);
    } catch (error) {
        console.error('❌ Error setting up Keycloak:', error);
        process.exit(1);
    }
}

setupKeycloak();
