import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinancialManagement1772200000000 implements MigrationInterface {
    name = 'AddFinancialManagement1772200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Payment status enum + columns on orders
        await queryRunner.query(`CREATE TYPE "payment_status_enum" AS ENUM ('UNPAID', 'PARTIAL', 'PAID')`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "amount_paid" decimal(10,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "payment_status" "payment_status_enum" NOT NULL DEFAULT 'UNPAID'`);

        // 2. Payment method & phase enums
        await queryRunner.query(`CREATE TYPE "payment_method_enum" AS ENUM ('CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER')`);
        await queryRunner.query(`CREATE TYPE "payment_phase_enum" AS ENUM ('AT_ORDER', 'AT_PICKUP')`);

        // 3. Payments table
        await queryRunner.query(`CREATE TABLE "payments" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "order_id" uuid NOT NULL,
            "amount" decimal(10,2) NOT NULL,
            "payment_method" "payment_method_enum" NOT NULL,
            "payment_phase" "payment_phase_enum" NOT NULL,
            "collected_by" character varying NOT NULL,
            "site_id" character varying NOT NULL,
            "session_id" uuid,
            "reference" character varying,
            "notes" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_payments" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_order" ON "payments" ("order_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_tenant" ON "payments" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_session" ON "payments" ("session_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_collected_by" ON "payments" ("collected_by")`);

        // 4. Session status enum
        await queryRunner.query(`CREATE TYPE "session_status_enum" AS ENUM ('OPEN', 'CLOSED', 'REMITTED')`);

        // 5. Cash register sessions table
        await queryRunner.query(`CREATE TABLE "cash_register_sessions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "site_id" character varying NOT NULL,
            "operator_id" character varying NOT NULL,
            "opened_at" TIMESTAMP NOT NULL DEFAULT now(),
            "closed_at" TIMESTAMP,
            "status" "session_status_enum" NOT NULL DEFAULT 'OPEN',
            "opening_balance" decimal(10,2) NOT NULL DEFAULT 0,
            "expected_cash" decimal(10,2) NOT NULL DEFAULT 0,
            "declared_cash" decimal(10,2),
            "discrepancy" decimal(10,2),
            "closed_by" character varying,
            "notes" text,
            CONSTRAINT "PK_cash_register_sessions" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_crs_tenant" ON "cash_register_sessions" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_crs_operator" ON "cash_register_sessions" ("operator_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_crs_site" ON "cash_register_sessions" ("site_id")`);

        // 6. Remittance status enum
        await queryRunner.query(`CREATE TYPE "remittance_status_enum" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'DISPUTED')`);

        // 7. Cash remittances table (operator -> manager)
        await queryRunner.query(`CREATE TABLE "cash_remittances" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "site_id" character varying NOT NULL,
            "session_id" uuid NOT NULL,
            "operator_id" character varying NOT NULL,
            "manager_id" character varying,
            "amount" decimal(10,2) NOT NULL,
            "status" "remittance_status_enum" NOT NULL DEFAULT 'PENDING',
            "acknowledged_at" TIMESTAMP,
            "manager_notes" text,
            "site_remittance_id" uuid,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_cash_remittances" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "cash_remittances" ADD CONSTRAINT "FK_cr_session" FOREIGN KEY ("session_id") REFERENCES "cash_register_sessions"("id") ON DELETE CASCADE`);
        await queryRunner.query(`CREATE INDEX "IDX_cr_tenant" ON "cash_remittances" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_cr_site" ON "cash_remittances" ("site_id")`);

        // 8. Site remittances table (manager -> tenant admin)
        await queryRunner.query(`CREATE TABLE "site_remittances" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenant_id" character varying NOT NULL,
            "site_id" character varying NOT NULL,
            "submitted_by" character varying NOT NULL,
            "received_by" character varying,
            "period_start" date NOT NULL,
            "period_end" date NOT NULL,
            "total_amount" decimal(10,2) NOT NULL,
            "status" "remittance_status_enum" NOT NULL DEFAULT 'PENDING',
            "acknowledged_at" TIMESTAMP,
            "notes" text,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_site_remittances" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`ALTER TABLE "cash_remittances" ADD CONSTRAINT "FK_cr_site_remittance" FOREIGN KEY ("site_remittance_id") REFERENCES "site_remittances"("id") ON DELETE SET NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_sr_tenant" ON "site_remittances" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_sr_site" ON "site_remittances" ("site_id")`);

        // 9. RLS policies for new tables
        await queryRunner.query(`ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY payments_tenant_isolation ON "payments" USING (tenant_id = current_setting('app.current_tenant_id', true))`);

        await queryRunner.query(`ALTER TABLE "cash_register_sessions" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY crs_tenant_isolation ON "cash_register_sessions" USING (tenant_id = current_setting('app.current_tenant_id', true))`);

        await queryRunner.query(`ALTER TABLE "cash_remittances" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY cr_tenant_isolation ON "cash_remittances" USING (tenant_id = current_setting('app.current_tenant_id', true))`);

        await queryRunner.query(`ALTER TABLE "site_remittances" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`CREATE POLICY sr_tenant_isolation ON "site_remittances" USING (tenant_id = current_setting('app.current_tenant_id', true))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY IF EXISTS sr_tenant_isolation ON "site_remittances"`);
        await queryRunner.query(`DROP POLICY IF EXISTS cr_tenant_isolation ON "cash_remittances"`);
        await queryRunner.query(`DROP POLICY IF EXISTS crs_tenant_isolation ON "cash_register_sessions"`);
        await queryRunner.query(`DROP POLICY IF EXISTS payments_tenant_isolation ON "payments"`);

        await queryRunner.query(`ALTER TABLE "cash_remittances" DROP CONSTRAINT IF EXISTS "FK_cr_site_remittance"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "site_remittances"`);
        await queryRunner.query(`ALTER TABLE "cash_remittances" DROP CONSTRAINT IF EXISTS "FK_cr_session"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cash_remittances"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cash_register_sessions"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_order"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);

        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_status"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "amount_paid"`);

        await queryRunner.query(`DROP TYPE IF EXISTS "remittance_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "session_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_phase_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    }
}
