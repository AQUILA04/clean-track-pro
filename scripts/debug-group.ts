import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';

async function debugGroup() {
    console.log('🔍 Starting Group Debug...');

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

        const groupName = 'DebugTenantGroup_' + Date.now();
        console.log(`Creating group: ${groupName}`);

        const group = await kcAdminClient.groups.create({
            name: groupName,
            attributes: {
                tenant_id: ['550e8400-debug-group'],
                foo: ['bar']
            }
        });

        console.log(`Group created. ID: ${group.id}`);

        const fetchedGroup = await kcAdminClient.groups.findOne({ id: group.id! });
        console.log('Fetched Group:', JSON.stringify(fetchedGroup, null, 2));

        if (fetchedGroup?.attributes?.tenant_id) {
            console.log('✅ Group Attributes WORK!');
        } else {
            console.error('❌ Group Attributes MISSING.');
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugGroup();
