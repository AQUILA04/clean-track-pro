import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateServiceTables1769542055698 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create service_definitions table
        await queryRunner.query(`
            CREATE TABLE "service_definitions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "tenant_id" uuid NOT NULL,
                "label" character varying(100) NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                CONSTRAINT "PK_service_definitions" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_service_definitions_tenant_label" UNIQUE ("tenant_id", "label")
            )
        `);

        // Enable RLS for service_definitions
        await queryRunner.query(`ALTER TABLE "service_definitions" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY "tenant_isolation_policy" ON "service_definitions"
            USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
        `);

        // Create service_prices table
        await queryRunner.query(`
            CREATE TABLE "service_prices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "tenant_id" uuid NOT NULL,
                "article_type_id" uuid NOT NULL,
                "service_definition_id" uuid NOT NULL,
                "price" numeric(10,2) NOT NULL,
                CONSTRAINT "PK_service_prices" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_service_prices_composite" UNIQUE ("tenant_id", "article_type_id", "service_definition_id")
            )
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "service_prices" 
            ADD CONSTRAINT "FK_service_prices_article_type" 
            FOREIGN KEY ("article_type_id") REFERENCES "article_types"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "service_prices" 
            ADD CONSTRAINT "FK_service_prices_service_definition" 
            FOREIGN KEY ("service_definition_id") REFERENCES "service_definitions"("id") ON DELETE CASCADE
        `);

        // Enable RLS for service_prices
        await queryRunner.query(`ALTER TABLE "service_prices" ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
            CREATE POLICY "tenant_isolation_policy" ON "service_prices"
            USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "service_prices"`);
        await queryRunner.query(`DROP TABLE "service_definitions"`);
    }

}
