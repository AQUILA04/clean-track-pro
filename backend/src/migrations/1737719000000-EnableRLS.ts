
import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableRLS1737719000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable RLS on tenants
        await queryRunner.query(`ALTER TABLE tenants ENABLE ROW LEVEL SECURITY`);

        // Policy for tenants: 
        // - A user can see their own tenant logic (match ID)
        // - OR Superadmin can see all
        await queryRunner.query(`
            CREATE POLICY tenant_isolation ON tenants
            USING (
                id::text = current_setting('app.current_tenant', true)
                OR
                current_setting('app.current_role', true) = 'superadmin'
            )
        `);

        // Force RLS to ensure no bypass unless explicitly defined
        await queryRunner.query(`ALTER TABLE tenants FORCE ROW LEVEL SECURITY`);

        // Enable RLS on users
        await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`);

        // Policy for users:
        // - Users belong to a tenant
        await queryRunner.query(`
            CREATE POLICY tenant_isolation ON users
            USING (
                tenant_id = current_setting('app.current_tenant', true)
                OR
                current_setting('app.current_role', true) = 'superadmin'
            )
        `);
        await queryRunner.query(`ALTER TABLE users FORCE ROW LEVEL SECURITY`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON users`);
        await queryRunner.query(`ALTER TABLE users DISABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON tenants`);
        await queryRunner.query(`ALTER TABLE tenants DISABLE ROW LEVEL SECURITY`);
    }
}
