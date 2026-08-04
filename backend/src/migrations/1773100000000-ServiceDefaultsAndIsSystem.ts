import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Adds is_system on service_definitions
 * - Seeds Lavage & Repassage for every tenant
 */
export class ServiceDefaultsAndIsSystem1773100000000 implements MigrationInterface {
    name = 'ServiceDefaultsAndIsSystem1773100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "service_definitions"
            ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false
        `);

        await queryRunner.query(`
            INSERT INTO "service_definitions" (
                "id", "tenant_id", "label", "description", "is_active", "is_system", "created_at", "updated_at"
            )
            SELECT
                uuid_generate_v4(),
                t.id,
                d.label,
                d.description,
                true,
                true,
                now(),
                now()
            FROM "tenants" t
            CROSS JOIN (
                VALUES
                    ('Lavage', 'Service de lavage'),
                    ('Repassage', 'Service de repassage')
            ) AS d(label, description)
            WHERE NOT EXISTS (
                SELECT 1
                FROM "service_definitions" sd
                WHERE sd.tenant_id = t.id
                  AND sd.label = d.label
            )
        `);

        await queryRunner.query(`
            UPDATE "service_definitions"
            SET "is_system" = true
            WHERE "label" IN ('Lavage', 'Repassage')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "service_definitions" DROP COLUMN IF EXISTS "is_system"
        `);
    }
}
