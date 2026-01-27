import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cleantrack-client';

async function getClientSecret() {
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

        const clients = await kcAdminClient.clients.find({ clientId: CLIENT_ID });
        if (clients.length === 0) {
            console.error('Client not found');
            process.exit(1);
        }

        const clientUuid = clients[0].id!;
        const secret = await kcAdminClient.clients.getClientSecret({ id: clientUuid });

        console.log(secret.value);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

getClientSecret();
