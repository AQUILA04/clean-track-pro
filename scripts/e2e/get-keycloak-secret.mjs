#!/usr/bin/env node
/**
 * Fetches the Keycloak client secret for E2E env configuration.
 */
import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'cleantrack-client';

const kc = new KcAdminClient({ baseUrl: KEYCLOAK_URL, realmName: 'master' });

await kc.auth({
    username: KEYCLOAK_ADMIN,
    password: KEYCLOAK_ADMIN_PASSWORD,
    grantType: 'password',
    clientId: 'admin-cli',
});

kc.setConfig({ realmName: REALM_NAME });

const clients = await kc.clients.find({ clientId: CLIENT_ID });
if (!clients.length) {
    console.error(`Client ${CLIENT_ID} not found in realm ${REALM_NAME}`);
    process.exit(1);
}

const secret = await kc.clients.getClientSecret({ id: clients[0].id });
if (!secret.value) {
    console.error('Client secret is empty');
    process.exit(1);
}

process.stdout.write(secret.value);
