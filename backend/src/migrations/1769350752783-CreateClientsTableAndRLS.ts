import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClientsTableAndRLS1769350752783 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create clients table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "clients" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "tenant_id" uuid NOT NULL, 
                "first_name" character varying NOT NULL, 
                "last_name" character varying NOT NULL, 
                "phone" character varying NOT NULL, 
                "email" character varying, 
                "unique_code" character varying(8) NOT NULL, 
                "notes" text, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_clients" PRIMARY KEY ("id")
            )
        `);

        // Add indexes (prefix search is B-Tree status quo before GIN migration)
        await queryRunner.query(`CREATE INDEX "IDX_clients_tenant_id" ON "clients" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_clients_unique_code" ON "clients" ("unique_code")`);

        // Ensure RLS is enabled
        await queryRunner.query(`ALTER TABLE clients ENABLE ROW LEVEL SECURITY`);

        // Create policy
        // Users can only access clients belonging to their tenant
        await queryRunner.query(`
            CREATE POLICY tenant_isolation ON clients
            USING (
                tenant_id = current_setting('app.current_tenant', true)::uuid
                OR
                current_setting('app.current_role', true) = 'superadmin'
            )
        `);

        // Force RLS
        await queryRunner.query(`ALTER TABLE clients FORCE ROW LEVEL SECURITY`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE clients DISABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON clients`);
        await queryRunner.query(`DROP TABLE IF EXISTS "clients"`);
    }

}
