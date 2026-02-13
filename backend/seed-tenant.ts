
import { AppDataSource } from './src/data-source';

async function seed() {
    await AppDataSource.initialize();

    // Check if tenant exists
    const existing = await AppDataSource.query(`SELECT * FROM tenants WHERE id = '550e8400-e29b-41d4-a716-446655440001'`);
    if (existing.length > 0) {
        console.log('Tenant already exists, check failed?');
        return;
    }

    console.log('Seeding tenant...');
    await AppDataSource.query(`
        INSERT INTO "tenants" ("id", "name", "subdomain", "express_multiplier", "express_sla_hours", "created_at")
        VALUES ('550e8400-e29b-41d4-a716-446655440001', 'CleanTrack Default', 'cleantrack', 1.5, 24, NOW())
    `);
    console.log('Tenant seeded successfully.');

    await AppDataSource.destroy();
}

seed().catch(console.error);
