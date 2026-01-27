const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'francis',
    password: 'Africa2025',
    database: 'cleantrack',
});

async function checkConn() {
    try {
        await client.connect();
        console.log('Connected successfully to cleantrack');
        const res = await client.query('SELECT NOW()');
        console.log('Time:', res.rows[0]);
    } catch (err) {
        console.error('Error connecting to cleantrack:', err);
    } finally {
        await client.end();
    }
}

checkConn();
