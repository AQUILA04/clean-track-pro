import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExpenses1772500000000 implements MigrationInterface {
    name = 'CreateExpenses1772500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "expense_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" character varying NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_expense_types" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `CREATE INDEX "IDX_expense_types_tenant" ON "expense_types" ("tenant_id")`,
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "UQ_expense_types_tenant_name" ON "expense_types" ("tenant_id", "name")`,
        );

        await queryRunner.query(`
            CREATE TABLE "expenses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" character varying NOT NULL,
                "site_id" character varying NOT NULL,
                "expense_type_id" uuid NOT NULL,
                "description" text NOT NULL,
                "amount" decimal(10,2) NOT NULL,
                "expense_date" date NOT NULL,
                "receipt_url" character varying,
                "created_by" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_expenses" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(
            `ALTER TABLE "expenses" ADD CONSTRAINT "FK_expenses_type" FOREIGN KEY ("expense_type_id") REFERENCES "expense_types"("id") ON DELETE RESTRICT`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_expenses_tenant" ON "expenses" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_expenses_site" ON "expenses" ("site_id")`);
        await queryRunner.query(
            `CREATE INDEX "IDX_expenses_type" ON "expenses" ("expense_type_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_expenses_date" ON "expenses" ("expense_date")`,
        );

        await queryRunner.query(`ALTER TABLE "expense_types" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY expense_types_tenant_isolation ON "expense_types"
            USING (tenant_id = current_setting('app.current_tenant_id', true))
        `);

        await queryRunner.query(`ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY expenses_tenant_isolation ON "expenses"
            USING (tenant_id = current_setting('app.current_tenant_id', true))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP POLICY IF EXISTS expenses_tenant_isolation ON "expenses"`);
        await queryRunner.query(
            `DROP POLICY IF EXISTS expense_types_tenant_isolation ON "expense_types"`,
        );
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "FK_expenses_type"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "expenses"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "expense_types"`);
    }
}
