import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStorageSlots1769610000000 implements MigrationInterface {
    name = 'CreateStorageSlots1769610000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."storage_slots_status_enum" AS ENUM('FREE', 'OCCUPIED', 'RESERVED')
        `);
        await queryRunner.query(`
            CREATE TABLE "storage_slots" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "status" "public"."storage_slots_status_enum" NOT NULL DEFAULT 'FREE',
                "site_id" character varying NOT NULL,
                "tenant_id" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_storage_slots_name_site_tenant" UNIQUE ("name", "site_id", "tenant_id"),
                CONSTRAINT "PK_storage_slots" PRIMARY KEY ("id")
            )
        `);

        // Enable RLS
        await queryRunner.query(`ALTER TABLE "storage_slots" ENABLE ROW LEVEL SECURITY`);

        // Add Policy
        await queryRunner.query(`
            CREATE POLICY tenant_isolation ON storage_slots
            USING (tenant_id = current_setting('app.current_tenant', true) OR current_setting('app.current_role', true) = 'superadmin')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY tenant_isolation ON storage_slots`);
        await queryRunner.query(`DROP TABLE "storage_slots"`);
        await queryRunner.query(`DROP TYPE "public"."storage_slots_status_enum"`);
    }
}
