
const issuer = 'http://localhost:8080/realms/master'; // Admin login is usually on master realm
const adminUser = 'admin';
const adminPass = 'admin';
const targetRealm = 'cleantrack';
const targetClient = 'cleantrack-client';

async function fix() {
    console.log('🔄 Attempting to retrieve client secret via Admin API...');

    try {
        // 1. Get Admin Token
        const tokenUrl = `${issuer}/protocol/openid-connect/token`;
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', 'admin-cli');
        params.append('username', adminUser);
        params.append('password', adminPass);

        const tokenRes = await fetch(tokenUrl, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!tokenRes.ok) {
            throw new Error(`Admin Login Failed: ${tokenRes.status} ${await tokenRes.text()}`);
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        console.log('✅ Admin Token Acquired.');

        // 2. Find Client UUID
        // GET /admin/realms/{realm}/clients?clientId={clientId}
        const findClientUrl = `http://localhost:8080/admin/realms/${targetRealm}/clients?clientId=${targetClient}`;
        const findRes = await fetch(findClientUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!findRes.ok) {
            throw new Error(`Find Client Failed: ${findRes.status} ${await findRes.text()}`);
        }

        const clients = await findRes.json();
        if (clients.length === 0) {
            throw new Error(`Client '${targetClient}' not found in realm '${targetRealm}'`);
        }

        const clientUuid = clients[0].id;
        console.log(`✅ Client Found: ID=${clientUuid}`);

        // 3. Get Client Secret
        // GET /admin/realms/{realm}/clients/{id}/client-secret
        const secretUrl = `http://localhost:8080/admin/realms/${targetRealm}/clients/${clientUuid}/client-secret`;
        const secretRes = await fetch(secretUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!secretRes.ok) {
            throw new Error(`Get Secret Failed: ${secretRes.status} ${await secretRes.text()}`);
        }

        const secretData = await secretRes.json();
        const secret = secretData.value;

        console.log('\n🎉 FOUND SECRET:');
        console.log('------------------------------------------------');
        console.log(secret);
        console.log('------------------------------------------------');

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

fix();
