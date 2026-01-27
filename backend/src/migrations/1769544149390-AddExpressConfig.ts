import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpressConfig1769544149390 implements MigrationInterface {
    name = 'AddExpressConfig1769544149390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_tenant_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_unique_code"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_first_name_gin_trgm"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_last_name_gin_trgm"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_phone_gin_trgm"`);
        await queryRunner.query(`CREATE TABLE "article_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "label" character varying(100) NOT NULL, "category" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_db378fd9b427c51a33d488b82d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2b70a0a193f035df77b8ebfe85" ON "article_types" ("tenant_id", "label") `);
        await queryRunner.query(`CREATE TABLE "service_definitions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "label" character varying(100) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_300d1139fc194cac7494ba109cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_62dee4d0e550ea95d25a3351b4" ON "service_definitions" ("tenant_id", "label") `);
        await queryRunner.query(`CREATE TABLE "service_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenant_id" uuid NOT NULL, "article_type_id" uuid NOT NULL, "service_definition_id" uuid NOT NULL, "price" numeric(10,2) NOT NULL, CONSTRAINT "UQ_1d97de09feb4dc35dce23d6afcd" UNIQUE ("tenant_id", "article_type_id", "service_definition_id"), CONSTRAINT "PK_d03695e32fe299c7b53f7775804" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "express_multiplier" numeric(10,2) NOT NULL DEFAULT '1.5'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "express_sla_hours" integer NOT NULL DEFAULT '24'`);
        await queryRunner.query(`CREATE INDEX "IDX_e7d8b637725986e7b5fa774a3f" ON "clients" ("tenant_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6c1464d4954b395feca8924568" ON "clients" ("unique_code") `);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "FK_ca38070f9f3b6573b0766eb395a" FOREIGN KEY ("article_type_id") REFERENCES "article_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_prices" ADD CONSTRAINT "FK_cc406dbb19e5d0608baf470f9b3" FOREIGN KEY ("service_definition_id") REFERENCES "service_definitions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT "FK_cc406dbb19e5d0608baf470f9b3"`);
        await queryRunner.query(`ALTER TABLE "service_prices" DROP CONSTRAINT "FK_ca38070f9f3b6573b0766eb395a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6c1464d4954b395feca8924568"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7d8b637725986e7b5fa774a3f"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "express_sla_hours"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "express_multiplier"`);
        await queryRunner.query(`DROP TABLE "service_prices"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_62dee4d0e550ea95d25a3351b4"`);
        await queryRunner.query(`DROP TABLE "service_definitions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b70a0a193f035df77b8ebfe85"`);
        await queryRunner.query(`DROP TABLE "article_types"`);
        await queryRunner.query(`CREATE INDEX "IDX_clients_phone_gin_trgm" ON "clients" ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_last_name_gin_trgm" ON "clients" ("last_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_first_name_gin_trgm" ON "clients" ("first_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_unique_code" ON "clients" ("unique_code") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_tenant_id" ON "clients" ("tenant_id") `);
    }

}
