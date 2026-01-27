import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpressConfig1769544149390 implements MigrationInterface {
    name = 'AddExpressConfig1769544149390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Removed duplicate table creations that were already handled in previous migrations
        await queryRunner.query(`ALTER TABLE "tenants" ADD "express_multiplier" numeric(10,2) NOT NULL DEFAULT '1.5'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "express_sla_hours" integer NOT NULL DEFAULT '24'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "express_sla_hours"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "express_multiplier"`);
    }

}
