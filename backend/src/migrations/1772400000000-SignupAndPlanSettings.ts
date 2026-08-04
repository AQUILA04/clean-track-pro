import { MigrationInterface, QueryRunner } from 'typeorm';

const FREE_LIMITS = {
    'sites.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 1, enforce: 'hard' }],
    },
    'orders.create': {
        type: 'usage',
        windows: [
            { period: 'daily', limit: 10, enforce: 'hard' },
            { period: 'weekly', limit: 40, enforce: 'hard' },
            { period: 'monthly', limit: 150, enforce: 'hard' },
        ],
    },
    'users.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 2, enforce: 'hard' }],
    },
    'storage_slots.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 25, enforce: 'hard' }],
    },
};

export class SignupAndPlanSettings1772400000000 implements MigrationInterface {
    name = 'SignupAndPlanSettings1772400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "subscription_plans"
            ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "is_free" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "auto_approve_signups" boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "stripe_price_id" character varying(255)
        `);

        await queryRunner.query(`
            CREATE TABLE "tenant_signup_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organization_name" character varying(120) NOT NULL,
                "agency_name" character varying(120) NOT NULL,
                "subdomain" character varying(63) NOT NULL,
                "admin_email" character varying(255) NOT NULL,
                "admin_first_name" character varying(80) NOT NULL,
                "admin_last_name" character varying(80) NOT NULL,
                "plan_id" uuid NOT NULL,
                "status" character varying(30) NOT NULL DEFAULT 'PENDING',
                "payment_reference" character varying(255),
                "payment_completed_at" TIMESTAMPTZ,
                "tenant_id" uuid,
                "reviewed_by" character varying(255),
                "reviewed_at" TIMESTAMPTZ,
                "rejection_reason" character varying(500),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tenant_signup_requests" PRIMARY KEY ("id"),
                CONSTRAINT "FK_signup_requests_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id"),
                CONSTRAINT "FK_signup_requests_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_signup_requests_status" ON "tenant_signup_requests" ("status")
        `);

        await queryRunner.query(`
            INSERT INTO "subscription_plans" ("name", "price", "billing_interval", "is_public", "is_active", "is_free", "auto_approve_signups", "limits", "features")
            VALUES (
                'Free',
                0.00,
                'MONTHLY',
                true,
                true,
                true,
                false,
                $1::jsonb,
                '{"remittances": false, "cash_register": false}'::jsonb
            )
            ON CONFLICT ("name") DO NOTHING
        `, [JSON.stringify(FREE_LIMITS)]);

        await queryRunner.query(`
            UPDATE "subscription_plans"
            SET "is_active" = true, "is_free" = false, "auto_approve_signups" = false
            WHERE "name" IN ('Starter', 'Pro')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "tenant_signup_requests"`);
        await queryRunner.query(`DELETE FROM "subscription_plans" WHERE "name" = 'Free'`);
        await queryRunner.query(`
            ALTER TABLE "subscription_plans"
            DROP COLUMN IF EXISTS "is_active",
            DROP COLUMN IF EXISTS "is_free",
            DROP COLUMN IF EXISTS "auto_approve_signups",
            DROP COLUMN IF EXISTS "stripe_price_id"
        `);
    }
}
