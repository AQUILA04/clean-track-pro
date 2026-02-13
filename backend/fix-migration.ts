
import { AppDataSource } from './src/data-source';

async function fix() {
    await AppDataSource.initialize();
    console.log('Deleting migration record for AddSiteDetails1770377319102...');
    await AppDataSource.query("DELETE FROM migrations WHERE name LIKE '%AddSiteDetails%'");
    console.log('Record deleted.');
    await AppDataSource.destroy();
}

fix().catch(console.error);
