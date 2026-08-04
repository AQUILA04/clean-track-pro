import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveryAndNotifications1772900000000 implements MigrationInterface {
    name = 'AddDeliveryAndNotifications1772900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "delivery_mode_enum" AS ENUM ('PICKUP', 'HOME_DELIVERY');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "notification_channel_enum" AS ENUM ('EMAIL', 'SMS');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "notification_status_enum" AS ENUM ('SENT', 'FAILED', 'SKIPPED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "localities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "site_id" uuid NOT NULL,
                "name" character varying(120) NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_localities" PRIMARY KEY ("id"),
                CONSTRAINT "FK_localities_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_localities_site" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_localities_tenant_site"
            ON "localities" ("tenant_id", "site_id")
        `);

        await queryRunner.query(`ALTER TABLE "localities" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY localities_tenant_isolation ON "localities"
            USING (tenant_id::text = current_setting('app.current_tenant_id', true))
        `);

        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN IF NOT EXISTS "delivery_mode" "delivery_mode_enum" NOT NULL DEFAULT 'PICKUP',
            ADD COLUMN IF NOT EXISTS "delivery_address" character varying(500),
            ADD COLUMN IF NOT EXISTS "delivery_phone" character varying(32),
            ADD COLUMN IF NOT EXISTS "locality_id" uuid
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "orders"
                ADD CONSTRAINT "FK_orders_locality"
                FOREIGN KEY ("locality_id") REFERENCES "localities"("id") ON DELETE SET NULL;
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_orders_delivery_ready"
            ON "orders" ("tenant_id", "site_id", "delivery_mode", "status", "locality_id")
        `);

        await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD COLUMN IF NOT EXISTS "notification_email_enabled" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "notification_sms_enabled" boolean NOT NULL DEFAULT false
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "platform_notification_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sms_unit_price" numeric(10,4),
                "currency" character varying(32) NOT NULL DEFAULT 'EUR',
                "updated_by" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_platform_notification_settings" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "platform_notification_settings" ("sms_unit_price", "currency")
            SELECT NULL, 'EUR'
            WHERE NOT EXISTS (SELECT 1 FROM "platform_notification_settings")
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notification_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "order_id" uuid,
                "channel" "notification_channel_enum" NOT NULL,
                "template_key" character varying(80) NOT NULL,
                "recipient" character varying(255) NOT NULL,
                "status" "notification_status_enum" NOT NULL,
                "unit_cost" numeric(10,4) NOT NULL DEFAULT 0,
                "provider_ref" character varying(255),
                "error" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id"),
                CONSTRAINT "FK_notification_logs_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_notification_logs_tenant"
            ON "notification_logs" ("tenant_id", "created_at")
        `);

        await queryRunner.query(`ALTER TABLE "notification_logs" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY notification_logs_tenant_isolation ON "notification_logs"
            USING (tenant_id::text = current_setting('app.current_tenant_id', true))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY IF EXISTS notification_logs_tenant_isolation ON "notification_logs"`);
        await queryRunner.query(`ALTER TABLE "notification_logs" DISABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);

        await queryRunner.query(`DROP TABLE IF EXISTS "platform_notification_settings"`);

        await queryRunner.query(`
            ALTER TABLE "tenants"
            DROP COLUMN IF EXISTS "notification_email_enabled",
            DROP COLUMN IF EXISTS "notification_sms_enabled"
        `);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_delivery_ready"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_locality"`);
        await queryRunner.query(`
            ALTER TABLE "orders"
            DROP COLUMN IF EXISTS "delivery_mode",
            DROP COLUMN IF EXISTS "delivery_address",
            DROP COLUMN IF EXISTS "delivery_phone",
            DROP COLUMN IF EXISTS "locality_id"
        `);

        await queryRunner.query(`DROP POLICY IF EXISTS localities_tenant_isolation ON "localities"`);
        await queryRunner.query(`ALTER TABLE "localities" DISABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_localities_tenant_site"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "localities"`);

        await queryRunner.query(`DROP TYPE IF EXISTS "notification_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "delivery_mode_enum"`);
    }
}
