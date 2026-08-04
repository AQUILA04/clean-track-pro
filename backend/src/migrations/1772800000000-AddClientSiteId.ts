import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds site_id (creation agency provenance) to clients.
 * Nullable for existing rows and Admin_Tenant creates without a site.
 */
export class AddClientSiteId1772800000000 implements MigrationInterface {
    name = 'AddClientSiteId1772800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD COLUMN IF NOT EXISTS "site_id" uuid
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_clients_site_id"
            ON "clients" ("site_id")
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "clients"
                ADD CONSTRAINT "FK_clients_site_id"
                FOREIGN KEY ("site_id") REFERENCES "sites"("id")
                ON DELETE SET NULL;
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "FK_clients_site_id"
        `);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_site_id"`);
        await queryRunner.query(`
            ALTER TABLE "clients" DROP COLUMN IF EXISTS "site_id"
        `);
    }
}
