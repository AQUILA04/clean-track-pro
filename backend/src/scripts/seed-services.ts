
import { DataSource } from 'typeorm';
import { ServiceDefinition } from '../catalog/entities/service-definition.entity';
import { AppDataSource } from '../data-source';

async function seed() {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const tenantId = '00000000-0000-0000-0000-000000000000'; // Replace with actual tenant ID if known, or handle in a way that respects RLS or disables it.
    // For seeding, we might need to bypass RLS or set the current tenant.
    // Since this is a script, RLS might not be active unless we enforce it in the connection or query.
    // However, our migration enabled RLS. So we need to set the tenant_id in the session or use a superuser connection that bypasses RLS if possible.
    // TypeORM usually connects as the user in config. If that user is table owner or superuser, RLS might be bypassed or apply.
    // Let's assume we can just insert with a specific tenant_id.

    // BUT WAIT: RLS policy checks `current_setting('app.current_tenant_id')`.
    // If we don't set it, insert might fail or not be visible.
    // We should try to set it.

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // We can't strictly "login" here easily without Keycloak.
    // But we can set the session variable if we are running raw queries or if we use the queryRunner to execute the seed.

    // Let's define some standard services
    const services = [
        { label: 'Washing', description: 'Standard washing service' },
        { label: 'Ironing', description: 'Ironing only' },
        { label: 'Dry Cleaning', description: 'Dry cleaning service' },
    ];

    // We need a valid tenant ID. I'll use a placeholder or try to find one.
    // For now, I'll prompt the user or just assume a dev tenant ID if this was for local dev.
    // Since I don't know the tenant ID, I can't really seed effectively for a *specific* user unless I query for one.
    // Let's query for the first tenant found.

    // Actually, bypassing RLS for seeding might be easier if we can.
    // Or we just insert raw SQL with `SET app.current_tenant_id = ...`

    try {
        // Find a tenant (assuming we have a tenants table or similar, but tenants might be in Keycloak).
        // If we don't have tenants table access here easily, I'll skip dynamic tenant fetching.
        // I will just create the services and assume the user will Create them via UI, OR
        // I will try to insert for a "Default" tenant if I can.

        // BETTER APPROACH:
        // The task says "Data Seeding: Create a script or fixture".
        // I'll create the script but maybe not run it automatically if I don't have the tenant ID.
        // I'll write it to take a tenant ID as arg or just use a hardcoded one for testing.

        console.log('This seed script requires a valid TENANT_ID to be set in the code or passed.');
        // For the sake of the task, I'll just write the code to insert for a specific tenant if provided.

        const targetTenantId = process.env.SEED_TENANT_ID;
        if (!targetTenantId) {
            console.log('Skipping Execution: SEED_TENANT_ID env var not set.');
            await AppDataSource.destroy();
            return;
        }

        await queryRunner.query(`SET app.current_tenant_id = '${targetTenantId}'`);

        const serviceRepo = queryRunner.manager.getRepository(ServiceDefinition);

        for (const s of services) {
            const exists = await serviceRepo.findOne({ where: { tenant_id: targetTenantId, label: s.label } });
            if (!exists) {
                await serviceRepo.save({
                    tenant_id: targetTenantId,
                    label: s.label,
                    description: s.description,
                    is_active: true
                });
                console.log(`Created service: ${s.label}`);
            } else {
                console.log(`Service already exists: ${s.label}`);
            }
        }

    } catch (e) {
        console.error('Error seeding services:', e);
    } finally {
        await queryRunner.release();
        await AppDataSource.destroy();
    }
}

seed();
