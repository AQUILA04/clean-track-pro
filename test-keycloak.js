
const issuer = 'http://localhost:8080/realms/cleantrack';
const clientId = 'cleantrack-client';
const clientSecret = 'lxD8HlzuidUNNt0KDCqkTuo7mTWkYSvE';

async function test() {
    console.log('Testing connectivity to:', issuer);

    // 1. Get OpenID Config
    try {
        const configUrl = `${issuer}/.well-known/openid-configuration`;
        console.log('Fetching:', configUrl);
        const configRes = await fetch(configUrl);
        if (!configRes.ok) {
            throw new Error(`Config fetch failed: ${configRes.status} ${configRes.statusText}`);
        }
        console.log('✅ OpenID Configuration fetched.');

        // 2. Test Credentials (Client Credentials Flow)
        // Access Token Endpoint
        const tokenUrl = `${issuer}/protocol/openid-connect/token`;
        console.log('Testing credentials against:', tokenUrl);

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        const tokenRes = await fetch(tokenUrl, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (tokenRes.ok) {
            console.log('✅ Client Credentials valid. Token received.');
            const data = await tokenRes.json();
            // console.log(data);
        } else {
            const text = await tokenRes.text();
            console.log('❌ Auth failed:', tokenRes.status, text);
            if (tokenRes.status === 401) {
                console.log('!!! CLIENT SECRET OR ID IS INCORRECT !!!');
            } else if (tokenRes.status === 400) {
                console.log('⚠️ Status 400 might mean client_credentials flow is not enabled for this client. But secret might be okay.');
            }
        }

    } catch (err) {
        console.error('❌ Connection Error:', err.message);
        if (err.cause) console.error(err.cause);
    }
}

test();
