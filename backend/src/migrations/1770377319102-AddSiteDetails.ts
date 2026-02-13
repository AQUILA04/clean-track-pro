import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSiteDetails1770377319102 implements MigrationInterface {
    name = 'AddSiteDetails1770377319102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT IF EXISTS "FK_service_prices_article_type"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT IF EXISTS "FK_service_prices_service_definition"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_orders_sla"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_sites_tenant_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_clients_tenant_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_clients_unique_code"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_clients_first_name_gin_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_clients_last_name_gin_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_clients_phone_gin_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_article_types_tenant_label"`);
        await queryRunner.query(`ALTER TABLE "storage_slots" DROP CONSTRAINT IF EXISTS "UQ_storage_slots_name_site_tenant"`);
        await queryRunner.query(`ALTER TABLE "service_definitions" DROP CONSTRAINT IF EXISTS "UQ_service_definitions_tenant_label"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT IF EXISTS "UQ_service_prices_composite"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN IF EXISTS "address"`);
        await queryRunner.query(`ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "location" character varying`);
        await queryRunner.query(`ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "city" character varying`);
        await queryRunner.query(`ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "postal_code" character varying`);
        await queryRunner.query(`ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "email" character varying`);
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."sites_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "status" "public"."sites_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "express_multiplier" SET DEFAULT '1.5'`);
        await queryRunner.query(`ALTER TABLE "service_definitions" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "service_definitions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "service_definitions" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "service_definitions" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP COLUMN IF EXISTS "created_at"`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bee73a348dcf70a5e113e865bb"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_e7d8b637725986e7b5fa774a3f"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_6c1464d4954b395feca8924568"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_2b70a0a193f035df77b8ebfe85"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_62dee4d0e550ea95d25a3351b4"`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bee73a348dcf70a5e113e865bb" ON "sites" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e7d8b637725986e7b5fa774a3f" ON "clients" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_6c1464d4954b395feca8924568" ON "clients" ("unique_code") `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_2b70a0a193f035df77b8ebfe85" ON "article_types" ("tenant_id", "label") `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_62dee4d0e550ea95d25a3351b4" ON "service_definitions" ("tenant_id", "label") `);

        await queryRunner.query(`ALTER TABLE "storage_slots" DROP CONSTRAINT IF EXISTS "UQ_dac8b5665fedb30a77580fbc3a1"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT IF EXISTS "UQ_1d97de09feb4dc35dce23d6afcd"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT IF EXISTS "FK_ca38070f9f3b6573b0766eb395a"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT IF EXISTS "FK_cc406dbb19e5d0608baf470f9b3"`);

        await queryRunner.query(`ALTER TABLE "storage_slots" ADD CONSTRAINT "UQ_dac8b5665fedb30a77580fbc3a1" UNIQUE ("name", "site_id", "tenant_id")`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "UQ_1d97de09feb4dc35dce23d6afcd" UNIQUE ("tenant_id", "article_type_id", "service_definition_id")`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "FK_ca38070f9f3b6573b0766eb395a" FOREIGN KEY ("article_type_id") REFERENCES "article_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "FK_cc406dbb19e5d0608baf470f9b3" FOREIGN KEY ("service_definition_id") REFERENCES "service_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT "FK_cc406dbb19e5d0608baf470f9b3"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT "FK_ca38070f9f3b6573b0766eb395a"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT "UQ_1d97de09feb4dc35dce23d6afcd"`);
        await queryRunner.query(`ALTER TABLE "storage_slots" DROP CONSTRAINT "UQ_dac8b5665fedb30a77580fbc3a1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_62dee4d0e550ea95d25a3351b4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b70a0a193f035df77b8ebfe85"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6c1464d4954b395feca8924568"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7d8b637725986e7b5fa774a3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bee73a348dcf70a5e113e865bb"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "service_definitions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "service_definitions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "service_definitions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "service_definitions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "express_multiplier" SET DEFAULT 1.5`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."sites_status_enum"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "postal_code"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "address" character varying`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "UQ_service_prices_composite" UNIQUE ("article_type_id", "service_definition_id", "tenant_id")`);
        await queryRunner.query(`ALTER TABLE "service_definitions" ADD CONSTRAINT "UQ_service_definitions_tenant_label" UNIQUE ("label", "tenant_id")`);
        await queryRunner.query(`ALTER TABLE "storage_slots" ADD CONSTRAINT "UQ_storage_slots_name_site_tenant" UNIQUE ("name", "site_id", "tenant_id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_article_types_tenant_label" ON "article_types" ("label", "tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_phone_gin_trgm" ON "clients" ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_last_name_gin_trgm" ON "clients" ("last_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_first_name_gin_trgm" ON "clients" ("first_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_unique_code" ON "clients" ("unique_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_tenant_id" ON "clients" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_sites_tenant_id" ON "sites" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_sla" ON "orders" ("due_date", "status", "tenant_id") `);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "FK_service_prices_service_definition" FOREIGN KEY ("service_definition_id") REFERENCES "service_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "FK_service_prices_article_type" FOREIGN KEY ("article_type_id") REFERENCES "article_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
