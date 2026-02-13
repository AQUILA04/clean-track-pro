
import { AppDataSource } from './src/data-source';

async function checkTenants() {
    await AppDataSource.initialize();
    console.log('Connected to DB:', AppDataSource.options.database);
    const tenants = await AppDataSource.query('SELECT * FROM tenants');
    console.log('Tenants in DB:', tenants);
    await AppDataSource.destroy();
}

checkTenants().catch(console.error);
