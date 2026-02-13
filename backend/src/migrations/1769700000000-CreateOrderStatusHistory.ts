import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderStatusHistory1769700000000 implements MigrationInterface {
    name = 'CreateOrderStatusHistory1769700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create order_status_history table
        await queryRunner.query(`
            CREATE TABLE "order_status_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "order_id" uuid NOT NULL,
                "tenant_id" uuid NOT NULL,
                "previous_status" "public"."orders_status_enum",
                "new_status" "public"."orders_status_enum" NOT NULL,
                "changed_by_user_id" uuid,
                "changed_at" TIMESTAMP NOT NULL DEFAULT now(),
                "notes" text,
                CONSTRAINT "PK_order_status_history" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "order_status_history" 
            ADD CONSTRAINT "FK_order_status_history_order" 
            FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "order_status_history" 
            ADD CONSTRAINT "FK_order_status_history_user" 
            FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX "IDX_order_status_history_order_id" ON "order_status_history" ("order_id")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_order_status_history_tenant_date" ON "order_status_history" ("tenant_id", "changed_at")
        `);

        // Enable RLS
        await queryRunner.query(`ALTER TABLE "order_status_history" ENABLE ROW LEVEL SECURITY`);

        // Create RLS policy
        await queryRunner.query(`
            CREATE POLICY tenant_isolation ON order_status_history
            USING (
                tenant_id = current_setting('app.current_tenant', true)::uuid
                OR
                current_setting('app.current_role', true) = 'superadmin'
            )
        `);

        // Force RLS
        await queryRunner.query(`ALTER TABLE "order_status_history" FORCE ROW LEVEL SECURITY`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_status_history" DISABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation ON order_status_history`);
        await queryRunner.query(`ALTER TABLE "order_status_history" DROP CONSTRAINT "FK_order_status_history_user"`);
        await queryRunner.query(`ALTER TABLE "order_status_history" DROP CONSTRAINT "FK_order_status_history_order"`);
        await queryRunner.query(`DROP TABLE "order_status_history"`);
    }
}