import { AppDataSource } from '../src/data-source';

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const SITE_ID = '660e8400-e29b-41d4-a716-446655440001';
const ORDERS = {
    CREATED: '770e8400-e29b-41d4-a716-446655440001',
    READY: '770e8400-e29b-41d4-a716-446655440002',
    STORED: '770e8400-e29b-41d4-a716-446655440003',
    DELIVERED: '770e8400-e29b-41d4-a716-446655440004',
};

async function seed() {
    await AppDataSource.initialize();
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();

    try {
        await qr.query(`SELECT set_config('app.current_tenant', '${TENANT_ID}', false)`);
        await qr.query(`SELECT set_config('app.current_tenant_id', '${TENANT_ID}', false)`);

        const tenant = await qr.query(`SELECT id FROM tenants WHERE id = $1`, [TENANT_ID]);
        if (!tenant.length) {
            await qr.query(
                `INSERT INTO tenants (id, name, subdomain, express_multiplier, express_sla_hours, created_at)
                 VALUES ($1, 'CleanTrack Default', 'cleantrack', 1.5, 24, NOW())`,
                [TENANT_ID],
            );
            console.log('✅ Tenant seeded');
        }

        const articles = [
            { label: 'Chemise', category: 'Vêtements', icon: 'Shirt' },
            { label: 'Pantalon', category: 'Vêtements', icon: 'Ticket' },
        ];

        for (const article of articles) {
            const exists = await qr.query(
                `SELECT id FROM article_types WHERE tenant_id = $1 AND label = $2`,
                [TENANT_ID, article.label],
            );
            if (!exists.length) {
                await qr.query(
                    `INSERT INTO article_types (tenant_id, label, category, is_active, icon)
                     VALUES ($1, $2, $3, true, $4)`,
                    [TENANT_ID, article.label, article.category, article.icon],
                );
                console.log(`✅ Article type seeded: ${article.label}`);
            }
        }

        const services = ['Lavage', 'Repassage', 'Nettoyage à sec'];
        for (const label of services) {
            const exists = await qr.query(
                `SELECT id FROM service_definitions WHERE tenant_id = $1 AND label = $2`,
                [TENANT_ID, label],
            );
            if (!exists.length) {
                await qr.query(
                    `INSERT INTO service_definitions (tenant_id, label, is_active)
                     VALUES ($1, $2, true)`,
                    [TENANT_ID, label],
                );
                console.log(`✅ Service seeded: ${label}`);
            }
        }

        const siteExists = await qr.query(`SELECT id FROM sites WHERE id = $1`, [SITE_ID]);
        if (!siteExists.length) {
            await qr.query(
                `INSERT INTO sites (id, tenant_id, name, city, postal_code, location, status)
                 VALUES ($1, $2, 'Agence Paris Centre', 'Paris', '75001', '1 rue de Rivoli', 'ACTIVE')`,
                [SITE_ID, TENANT_ID],
            );
            console.log('✅ Site seeded: Agence Paris Centre');
        }

        const clients = [
            { first_name: 'Alice', last_name: 'Martin', phone: '+33610000001', unique_code: 'CLNTA001' },
            { first_name: 'Lucas', last_name: 'Bernard', phone: '+33610000002', unique_code: 'CLNTA002' },
        ];
        for (const client of clients) {
            const exists = await qr.query(
                `SELECT id FROM clients WHERE tenant_id = $1 AND unique_code = $2`,
                [TENANT_ID, client.unique_code],
            );
            if (!exists.length) {
                await qr.query(
                    `INSERT INTO clients (tenant_id, first_name, last_name, phone, unique_code, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                    [TENANT_ID, client.first_name, client.last_name, client.phone, client.unique_code],
                );
                console.log(`✅ Client seeded: ${client.first_name} ${client.last_name}`);
            }
        }

        const slotConfigs = [
            { name: 'A-01', slot_type: 'RECEPTION' },
            { name: 'A-02', slot_type: 'RECEPTION' },
            { name: 'B-01', slot_type: 'DELIVERY' },
        ];
        for (const slot of slotConfigs) {
            const slotExists = await qr.query(
                `SELECT id FROM storage_slots WHERE tenant_id = $1 AND site_id = $2 AND name = $3`,
                [TENANT_ID, SITE_ID, slot.name],
            );
            if (!slotExists.length) {
                await qr.query(
                    `INSERT INTO storage_slots (tenant_id, site_id, name, status, slot_type, created_at, updated_at)
                     VALUES ($1, $2, $3, 'FREE', $4, NOW(), NOW())`,
                    [TENANT_ID, SITE_ID, slot.name, slot.slot_type],
                );
                console.log(`✅ Storage slot seeded: ${slot.name} (${slot.slot_type})`);
            } else {
                await qr.query(
                    `UPDATE storage_slots SET slot_type = $4, updated_at = NOW()
                     WHERE tenant_id = $1 AND site_id = $2 AND name = $3`,
                    [TENANT_ID, SITE_ID, slot.name, slot.slot_type],
                );
            }
        }

        const articleIds = await qr.query(
            `SELECT id, label FROM article_types WHERE tenant_id = $1 AND is_active = true ORDER BY created_at ASC`,
            [TENANT_ID],
        );
        const serviceIds = await qr.query(
            `SELECT id, label FROM service_definitions WHERE tenant_id = $1 AND is_active = true ORDER BY created_at ASC`,
            [TENANT_ID],
        );

        for (const article of articleIds) {
            for (const service of serviceIds) {
                const priceExists = await qr.query(
                    `SELECT id FROM service_prices WHERE tenant_id = $1 AND article_type_id = $2 AND service_definition_id = $3`,
                    [TENANT_ID, article.id, service.id],
                );
                if (!priceExists.length) {
                    const seededPrice = service.label === 'Lavage' ? 12.5 : service.label === 'Repassage' ? 8.5 : 15.0;
                    await qr.query(
                        `INSERT INTO service_prices (tenant_id, article_type_id, service_definition_id, price, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                        [TENANT_ID, article.id, service.id, seededPrice],
                    );
                }
            }
        }
        console.log('✅ Service prices seeded for active catalog pairs');

        const defaultClient = await qr.query(
            `SELECT id FROM clients WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1`,
            [TENANT_ID],
        );
        const defaultArticle = articleIds[0];
        const defaultService = serviceIds[0];
        if (defaultClient.length && defaultArticle && defaultService) {
            const createdOrderTemplates = [
                { id: ORDERS.CREATED, status: 'CREATED', service_level: 'NORMAL' },
                { id: ORDERS.READY, status: 'READY', service_level: 'NORMAL' },
                { id: ORDERS.STORED, status: 'STORED', service_level: 'NORMAL' },
                { id: ORDERS.DELIVERED, status: 'DELIVERED', service_level: 'EXPRESS' },
            ];

            for (const template of createdOrderTemplates) {
                const exists = await qr.query(`SELECT id FROM orders WHERE id = $1`, [template.id]);
                if (!exists.length) {
                    await qr.query(
                        `INSERT INTO orders (id, tenant_id, site_id, client_id, status, service_level, due_date, total_price, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, $5, $6, NOW() + interval '24 hour', 25.00, NOW(), NOW())`,
                        [template.id, TENANT_ID, SITE_ID, defaultClient[0].id, template.status, template.service_level],
                    );
                } else {
                    await qr.query(
                        `UPDATE orders SET status = $2, site_id = $3, tenant_id = $4, updated_at = NOW() WHERE id = $1`,
                        [template.id, template.status, SITE_ID, TENANT_ID],
                    );
                }

                const itemExists = await qr.query(`SELECT id FROM order_items WHERE order_id = $1 LIMIT 1`, [template.id]);
                if (!itemExists.length) {
                    await qr.query(
                        `INSERT INTO order_items (order_id, article_type_id, service_definition_id, quantity, price, created_at, updated_at)
                         VALUES ($1, $2, $3, 2, 12.50, NOW(), NOW())`,
                        [template.id, defaultArticle.id, defaultService.id],
                    );
                }
            }

            const slotB01 = await qr.query(
                `SELECT id FROM storage_slots WHERE tenant_id = $1 AND site_id = $2 AND name = 'B-01' LIMIT 1`,
                [TENANT_ID, SITE_ID],
            );
            if (slotB01.length) {
                await qr.query(
                    `UPDATE storage_slots
                     SET status = CASE
                         WHEN id = $1 THEN 'OCCUPIED'::storage_slots_status_enum
                         ELSE 'FREE'::storage_slots_status_enum
                     END
                     WHERE tenant_id = $2 AND site_id = $3`,
                    [slotB01[0].id, TENANT_ID, SITE_ID],
                );

                await qr.query(`DELETE FROM order_storage WHERE order_id = $1`, [ORDERS.STORED]);
                await qr.query(
                    `INSERT INTO order_storage (order_id, shelf_slot_id, tenant_id, stored_at)
                     VALUES ($1, $2, $3, NOW())
                     ON CONFLICT (order_id, shelf_slot_id) DO NOTHING`,
                    [ORDERS.STORED, slotB01[0].id, TENANT_ID],
                );
            }
            console.log('✅ Workflow orders seeded (CREATED, READY, STORED, DELIVERED)');
        }
    } finally {
        await qr.release();
        await AppDataSource.destroy();
    }
}

seed().catch((err) => {
    console.error('E2E seed failed:', err);
    process.exit(1);
});
