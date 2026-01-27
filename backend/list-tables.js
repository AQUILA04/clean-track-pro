const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'francis',
    password: 'Africa2025',
    database: 'cleantrack',
});

async function listTables() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

listTables();
