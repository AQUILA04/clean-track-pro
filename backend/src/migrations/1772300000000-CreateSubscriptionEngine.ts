import { MigrationInterface, QueryRunner } from 'typeorm';

const STARTER_LIMITS = {
    'sites.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 1, enforce: 'hard' }],
    },
    'orders.create': {
        type: 'usage',
        windows: [
            { period: 'daily', limit: 20, enforce: 'hard', warnAt: [0.8] },
            { period: 'weekly', limit: 100, enforce: 'hard', warnAt: [0.8, 0.9] },
            { period: 'monthly', limit: 500, enforce: 'hard', warnAt: [0.8, 0.9] },
        ],
    },
    'users.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 3, enforce: 'hard' }],
    },
    'storage_slots.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 50, enforce: 'hard' }],
    },
};

const PRO_LIMITS = {
    'sites.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 5, enforce: 'hard' }],
    },
    'orders.create': {
        type: 'usage',
        windows: [
            { period: 'daily', limit: 50, enforce: 'hard', warnAt: [0.8] },
            { period: 'weekly', limit: 500, enforce: 'hard', warnAt: [0.8, 0.9] },
            { period: 'monthly', limit: 2000, enforce: 'hard', warnAt: [0.8, 0.9] },
        ],
    },
    'users.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 15, enforce: 'hard' }],
    },
    'storage_slots.capacity': {
        type: 'capacity',
        windows: [{ period: 'none', limit: 200, enforce: 'hard' }],
    },
};

export class CreateSubscriptionEngine1772300000000 implements MigrationInterface {
    name = 'CreateSubscriptionEngine1772300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD COLUMN IF NOT EXISTS "timezone" character varying NOT NULL DEFAULT 'Europe/Paris'
        `);

        await queryRunner.query(`
            CREATE TABLE "subscription_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(50) NOT NULL,
                "price" numeric(10,2) NOT NULL DEFAULT 0,
                "billing_interval" character varying(10) NOT NULL DEFAULT 'MONTHLY',
                "is_public" boolean NOT NULL DEFAULT true,
                "limits" jsonb NOT NULL DEFAULT '{}',
                "features" jsonb NOT NULL DEFAULT '{}',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_subscription_plans_name" UNIQUE ("name")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "tenant_subscriptions" (
                "tenant_id" uuid NOT NULL,
                "plan_id" uuid NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
                "trial_ends_at" TIMESTAMPTZ,
                "current_period_start" TIMESTAMPTZ NOT NULL,
                "current_period_end" TIMESTAMPTZ NOT NULL,
                "grace_period_ends_at" TIMESTAMPTZ,
                "custom_limits" jsonb NOT NULL DEFAULT '{}',
                "external_billing_id" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tenant_subscriptions" PRIMARY KEY ("tenant_id"),
                CONSTRAINT "FK_tenant_subscriptions_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_tenant_subscriptions_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "tenant_usage_periods" (
                "tenant_id" uuid NOT NULL,
                "operation_key" character varying(64) NOT NULL,
                "period_type" character varying(10) NOT NULL,
                "period_key" character varying(16) NOT NULL,
                "period_start" TIMESTAMPTZ NOT NULL,
                "period_end" TIMESTAMPTZ NOT NULL,
                "count" bigint NOT NULL DEFAULT 0,
                CONSTRAINT "PK_tenant_usage_periods" PRIMARY KEY ("tenant_id", "operation_key", "period_type", "period_key")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "subscription_plans" ("name", "price", "billing_interval", "limits", "features")
            VALUES
                ('Starter', 49.00, 'MONTHLY', $1::jsonb, '{"remittances": false, "cash_register": false}'::jsonb),
                ('Pro', 129.00, 'MONTHLY', $2::jsonb, '{"remittances": true, "cash_register": true}'::jsonb)
            ON CONFLICT ("name") DO NOTHING
        `, [JSON.stringify(STARTER_LIMITS), JSON.stringify(PRO_LIMITS)]);

        await queryRunner.query(`
            INSERT INTO "tenant_subscriptions" ("tenant_id", "plan_id", "status", "current_period_start", "current_period_end")
            SELECT
                t.id,
                p.id,
                'ACTIVE',
                NOW(),
                NOW() + INTERVAL '1 month'
            FROM "tenants" t
            CROSS JOIN "subscription_plans" p
            WHERE p.name = 'Starter'
            AND NOT EXISTS (
                SELECT 1 FROM "tenant_subscriptions" ts WHERE ts.tenant_id = t.id
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "tenant_usage_periods"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tenant_subscriptions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "timezone"`);
    }
}
