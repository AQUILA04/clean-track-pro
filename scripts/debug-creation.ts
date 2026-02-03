import KcAdminClient from '@keycloak/keycloak-admin-client';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
const REALM_NAME = process.env.KEYCLOAK_REALM || 'cleantrack';

async function debugCreation() {
    console.log('🔍 Starting User Creation Debug...');

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

        // Strategy 0: Disable User Profile (if possible)
        console.log('Strategy 0: Disabling User Profile...');
        try {
            const realm = await kcAdminClient.realms.findOne({ realm: REALM_NAME });
            await kcAdminClient.realms.update({ realm: REALM_NAME }, {
                ...realm,
                attributes: {
                    ...realm?.attributes,
                    userProfileEnabled: 'false'
                }
            });
            console.log('✅ Realm updated (UserProfile disabled)');
        } catch (e) {
            console.log('⚠️ Failed to disable UserProfile:', e.message);
        }

        const username = 'debug_user_' + Date.now();
        console.log(`Creating user: ${username}`);

        // Strategy 1: Create with all fields
        const user = await kcAdminClient.users.create({
            username: username,
            email: `${username}@test.local`,
            enabled: true,
            emailVerified: true,
            attributes: {
                test_attr: ['value123']
            },
            realm: REALM_NAME
        });

        console.log(`User created. ID: ${user.id}`);

        // Verify immediately
        const fetchedUser = await kcAdminClient.users.findOne({ id: user.id });
        console.log('Fetched User (Immediately):', JSON.stringify(fetchedUser, null, 2));

        if (!fetchedUser?.email || !fetchedUser?.attributes?.test_attr) {
            console.error('❌ Strategy 1 Failed: Attributes/Email missing.');

            // Strategy 2: Explicit Update
            console.log('Attempting Update...');
            await kcAdminClient.users.update(
                { id: user.id, realm: REALM_NAME },
                {
                    firstName: 'UpdatedName',
                    attributes: { test_attr: ['updated_value'] }
                }
            );

            const updatedUser = await kcAdminClient.users.findOne({ id: user.id });
            console.log('Fetched User (After Update):', JSON.stringify(updatedUser, null, 2));
        } else {
            console.log('✅ Strategy 1 Success!');
        }

        // Check Realm User Profile Config
        try {
            console.log('\n🔍 Checking User Profile Configuration...');
            // @ts-ignore - getUsersProfile might not be in the typings depending on version
            const profile = await kcAdminClient.users.getProfile({ realm: REALM_NAME }).catch(e => null);
            // Wait, getProfile gets the "current user's profile". We want the Realm User Profile Config.
            // It's usually under kcAdminClient.realms... but might be separate resource.
            // Let's try raw request if possible or infer from behavior.

            // Alternative: Try to see if we can update realm to disable UP or enable unmanaged attributes
            const realm = await kcAdminClient.realms.findOne({ realm: REALM_NAME });
            console.log(`Realm Attributes:`, JSON.stringify(realm?.attributes, null, 2));

        } catch (e) {
            console.log('Could not fetch realm details');
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugCreation();
