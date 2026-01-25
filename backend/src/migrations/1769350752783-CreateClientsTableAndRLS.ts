import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClientsTableAndRLS1769350752783 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // We assume the table 'clients' is created by TypeORM synchronization or another migration
        // But to be safe in a real production flow, we would define CREATE TABLE here.
        // Given 'synchronize: true' in dev, we focus on RLS application which TypeORM doesn't handle.

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
    }

}
