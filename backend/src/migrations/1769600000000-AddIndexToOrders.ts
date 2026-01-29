import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexToOrders1769600000000 implements MigrationInterface {
    name = 'AddIndexToOrders1769600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUMS
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('CREATED', 'IN_PROGRESS', 'READY', 'STORED', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_service_level_enum" AS ENUM('NORMAL', 'EXPRESS')`);

        // Create Tables
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying NOT NULL, "site_id" character varying NOT NULL, "client_id" character varying NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'CREATED', "service_level" "public"."orders_service_level_enum" NOT NULL DEFAULT 'NORMAL', "due_date" TIMESTAMP NOT NULL, "total_price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);

        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "article_type_id" character varying NOT NULL, "service_definition_id" character varying NOT NULL, "quantity" integer NOT NULL, "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);

        // Add FK
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Add Index (Original purpose)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_orders_sla" ON "orders" ("tenant_id", "status", "due_date")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_orders_sla"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_service_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }
}
