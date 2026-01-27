import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArticleTypesTable1769516600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "article_types" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "tenant_id" uuid NOT NULL,
        "label" character varying(100) NOT NULL,
        "category" character varying(50) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_article_types" PRIMARY KEY ("id")
      )
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_article_types_tenant_label" ON "article_types" ("tenant_id", "label")
    `);

        await queryRunner.query(`
      ALTER TABLE "article_types" ENABLE ROW LEVEL SECURITY
    `);

        await queryRunner.query(`
      CREATE POLICY "tenant_isolation_policy" ON "article_types"
      USING ("tenant_id" = current_setting('app.current_tenant')::uuid)
      WITH CHECK ("tenant_id" = current_setting('app.current_tenant')::uuid)
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "article_types"`);
    }
}
