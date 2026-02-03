import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cleantrack-client';

async function diagnose() {
    console.log('🔍 Starting Keycloak Diagnosis...');

    const kcAdminClient = new KcAdminClient({
        baseUrl: KEYCLOAK_URL,
        realmName: 'master',
    });

    try {
        await kcAdminClient.auth({
            username: KEYCLOAK_ADMIN,
            password: KEYCLOAK_ADMIN_PASSWORD,
            grantType: 'password',
            clientId: 'admin-cli',
        });

        kcAdminClient.setConfig({ realmName: REALM_NAME });

        // 1. Inspect Client Mappers
        console.log(`\n=== 1. Inspecting Client: ${CLIENT_ID} ===`);
        const clients = await kcAdminClient.clients.find({ clientId: CLIENT_ID });
        if (clients.length === 0) {
            console.error('❌ Client not found!');
            return;
        }
        const clientUuid = clients[0].id!;
        console.log(`Client UUID: ${clientUuid}`);

        const mappers = await kcAdminClient.clients.listProtocolMappers({ id: clientUuid });
        const tenantMapper = mappers.find((m: any) => m.name === 'tenant_id');

        console.log('\n--- Mapper: tenant_id ---');
        if (tenantMapper) {
            console.log(JSON.stringify(tenantMapper, null, 2));
        } else {
            console.error('❌ Mapper "tenant_id" NOT FOUND');
        }

        // 2. Inspect Users
        console.log(`\n=== 2. Inspecting Users ===`);
        const usersList = await kcAdminClient.users.find({ realm: REALM_NAME });

        for (const listUser of usersList) {
            const user = await kcAdminClient.users.findOne({ id: listUser.id!, realm: REALM_NAME });
            console.log(`\nUser Object Dump (${listUser.username}):`, JSON.stringify(user, null, 2));
        }

    } catch (error) {
        console.error('❌ Diagnosis failed:', error);
    }
}

diagnose();
