
import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableRLS1737719000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create tables if they don't exist
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tenants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying NOT NULL, 
                "subdomain" character varying NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_subdomain" UNIQUE ("subdomain"), 
                CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "email" character varying NOT NULL, 
                "tenant_id" uuid, 
                "firstName" character varying, 
                "lastName" character varying, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_email" UNIQUE ("email"), 
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

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
                tenant_id = current_setting('app.current_tenant', true)::uuid
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

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    }
}
