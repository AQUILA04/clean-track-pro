import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds human-readable order references (REF-SS-YYMM-NNNNNN)
 * and sequential site codes per tenant.
 */
export class AddOrderReferenceAndSiteCode1772700000000 implements MigrationInterface {
    name = 'AddOrderReferenceAndSiteCode1772700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "sites"
            ADD COLUMN IF NOT EXISTS "code" smallint
        `);

        await queryRunner.query(`
            WITH ranked AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY tenant_id
                        ORDER BY created_at ASC NULLS LAST, id ASC
                    ) AS rn
                FROM "sites"
                WHERE "code" IS NULL
            )
            UPDATE "sites" s
            SET "code" = ranked.rn
            FROM ranked
            WHERE s.id = ranked.id
        `);

        await queryRunner.query(`
            ALTER TABLE "sites"
            ALTER COLUMN "code" SET NOT NULL
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sites_tenant_code"
            ON "sites" ("tenant_id", "code")
        `);

        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "reference" character varying(32)
        `);

        await queryRunner.query(`
            WITH numbered AS (
                SELECT
                    o.id,
                    LPAD(s.code::text, 2, '0') AS site_code,
                    TO_CHAR(COALESCE(o.created_at, NOW()), 'YYMM') AS yymm,
                    LPAD(
                        ROW_NUMBER() OVER (
                            PARTITION BY o.site_id, TO_CHAR(COALESCE(o.created_at, NOW()), 'YYMM')
                            ORDER BY o.created_at ASC NULLS LAST, o.id ASC
                        )::text,
                        6,
                        '0'
                    ) AS seq
                FROM "orders" o
                INNER JOIN "sites" s ON s.id::text = o.site_id::text
                WHERE o.reference IS NULL
            )
            UPDATE "orders" o
            SET reference = 'REF-' || n.site_code || '-' || n.yymm || '-' || n.seq
            FROM numbered n
            WHERE o.id = n.id
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "UQ_orders_tenant_reference"
            ON "orders" ("tenant_id", "reference")
            WHERE "reference" IS NOT NULL
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_orders_reference"
            ON "orders" ("reference")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_reference"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_orders_tenant_reference"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "reference"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sites_tenant_code"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN IF EXISTS "code"`);
    }
}
