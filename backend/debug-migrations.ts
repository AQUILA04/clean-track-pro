
import { AppDataSource } from './src/data-source';

async function check() {
    await AppDataSource.initialize();
    console.log('Connected to DB:', AppDataSource.options.database);
    const migrations = await AppDataSource.query('SELECT * FROM migrations');
    console.log('Migrations in DB:', migrations);
    await AppDataSource.destroy();
}

check().catch(console.error);
