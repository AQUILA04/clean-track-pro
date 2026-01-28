import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexToOrders1769600000000 implements MigrationInterface {
    name = 'AddIndexToOrders1769600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "idx_orders_sla" ON "orders" ("tenant_id", "status", "due_date")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX "idx_orders_sla"`
        );
    }
}
