import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Adds is_system on expense_types
 * - Aligns RLS with app.current_tenant (same as RlsService / sites)
 * - Seeds default types (Loyer, Fournitures, Salaires, Autres) for all tenants
 */
export class ExpenseTypesDefaultsAndRlsFix1773000000000 implements MigrationInterface {
    name = 'ExpenseTypesDefaultsAndRlsFix1773000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "expense_types"
            ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false
        `);

        // Align RLS setting name with RlsService (app.current_tenant)
        await queryRunner.query(
            `DROP POLICY IF EXISTS expense_types_tenant_isolation ON "expense_types"`,
        );
        await queryRunner.query(
            `DROP POLICY IF EXISTS expenses_tenant_isolation ON "expenses"`,
        );
        await queryRunner.query(`
            CREATE POLICY expense_types_tenant_isolation ON "expense_types"
            USING (
                tenant_id = current_setting('app.current_tenant', true)
                OR current_setting('app.current_role', true) = 'superadmin'
            )
        `);
        await queryRunner.query(`
            CREATE POLICY expenses_tenant_isolation ON "expenses"
            USING (
                tenant_id = current_setting('app.current_tenant', true)
                OR current_setting('app.current_role', true) = 'superadmin'
            )
        `);

        // Backfill defaults for every tenant (idempotent by name)
        await queryRunner.query(`
            INSERT INTO "expense_types" (
                "id", "tenant_id", "name", "description", "is_active", "is_system", "created_at", "updated_at"
            )
            SELECT
                uuid_generate_v4(),
                t.id::text,
                d.name,
                d.description,
                true,
                true,
                now(),
                now()
            FROM "tenants" t
            CROSS JOIN (
                VALUES
                    ('Loyer', 'Loyer et charges locatives'),
                    ('Fournitures', 'Fournitures et consommables'),
                    ('Salaires', 'Salaires et charges sociales'),
                    ('Autres', 'Autres dépenses')
            ) AS d(name, description)
            WHERE NOT EXISTS (
                SELECT 1
                FROM "expense_types" et
                WHERE et.tenant_id = t.id::text
                  AND et.name = d.name
            )
        `);

        // Mark already-existing default names as system types
        await queryRunner.query(`
            UPDATE "expense_types"
            SET "is_system" = true
            WHERE "name" IN ('Loyer', 'Fournitures', 'Salaires', 'Autres')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP POLICY IF EXISTS expense_types_tenant_isolation ON "expense_types"`,
        );
        await queryRunner.query(
            `DROP POLICY IF EXISTS expenses_tenant_isolation ON "expenses"`,
        );
        await queryRunner.query(`
            CREATE POLICY expense_types_tenant_isolation ON "expense_types"
            USING (tenant_id = current_setting('app.current_tenant_id', true))
        `);
        await queryRunner.query(`
            CREATE POLICY expenses_tenant_isolation ON "expenses"
            USING (tenant_id = current_setting('app.current_tenant_id', true))
        `);

        await queryRunner.query(`
            ALTER TABLE "expense_types" DROP COLUMN IF EXISTS "is_system"
        `);
    }
}
