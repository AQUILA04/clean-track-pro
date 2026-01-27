const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'francis',
    password: 'Africa2025',
    database: 'postgres', // Connect to default postgres DB to list others
});

async function listDbs() {
    try {
        await client.connect();
        const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
        console.log('Databases:', res.rows.map(r => r.datname).join(', '));
    } catch (err) {
        console.error('Error connecting:', err);
    } finally {
        await client.end();
    }
}

listDbs();
