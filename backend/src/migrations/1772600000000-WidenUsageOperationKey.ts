import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Idempotency keys are stored as:
 *   `{operation}:idempotency:{uuid}:{period}:{periodKey}`
 * which exceeds the original varchar(64) (e.g. ~85 chars for orders.create).
 */
export class WidenUsageOperationKey1772600000000 implements MigrationInterface {
    name = 'WidenUsageOperationKey1772600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tenant_usage_periods"
            ALTER COLUMN "operation_key" TYPE character varying(128)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tenant_usage_periods"
            ALTER COLUMN "operation_key" TYPE character varying(64)
        `);
    }
}
