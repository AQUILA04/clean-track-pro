import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderStorage1769627626948 implements MigrationInterface {
    name = 'OrderStorage1769627626948'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order_storage" ("order_id" uuid NOT NULL, "shelf_slot_id" uuid NOT NULL, "tenant_id" character varying NOT NULL, "stored_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4e788602da2b9349a22fbcf5069" PRIMARY KEY ("order_id", "shelf_slot_id"))`);
        await queryRunner.query(`ALTER TABLE "order_storage" ADD CONSTRAINT "FK_1f2e9a649126012e599eee8f241" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_storage" ADD CONSTRAINT "FK_84ed2135cfdfa5f6e3fa02696d4" FOREIGN KEY ("shelf_slot_id") REFERENCES "storage_slots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_storage" DROP CONSTRAINT "FK_84ed2135cfdfa5f6e3fa02696d4"`);
        await queryRunner.query(`ALTER TABLE "order_storage" DROP CONSTRAINT "FK_1f2e9a649126012e599eee8f241"`);
        await queryRunner.query(`DROP TABLE "order_storage"`);
    }

}
