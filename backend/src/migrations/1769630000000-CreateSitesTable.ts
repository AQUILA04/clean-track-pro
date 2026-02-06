import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSitesTable1769630000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create sites table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sites" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "tenant_id" uuid NOT NULL, 
                "name" character varying NOT NULL, 
                "address" character varying, 
                "phone" character varying, 
                "logoUrl" character varying, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_sites" PRIMARY KEY ("id")
            )
        `);

        // Add index on tenant_id
        await queryRunner.query(`CREATE INDEX "IDX_sites_tenant_id" ON "sites" ("tenant_id")`);

        // Ensure RLS is enabled
        await queryRunner.query(`ALTER TABLE sites ENABLE ROW LEVEL SECURITY`);

        // Create policy
        // Users can only access sites belonging to their tenant
        await queryRunner.query(`
            CREATE POLICY tenant_isolation ON sites
            USING (
                tenant_id = current_setting('app.current_tenant', true)::uuid
                OR
                current_setting('app.current_role', true) = 'superadmin'
            )
        `);

        // Force RLS
        await queryRunner.query(`ALTER TABLE sites FORCE ROW LEVEL SECURITY`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE sites DISABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON sites`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sites"`);
    }

}
