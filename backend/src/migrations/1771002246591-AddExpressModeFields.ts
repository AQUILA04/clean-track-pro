import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpressModeFields1771002246591 implements MigrationInterface {
    name = 'AddExpressModeFields1771002246591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ADD "express_enabled" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "currency" character varying NOT NULL DEFAULT 'Euro (€)'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "weight_unit" character varying NOT NULL DEFAULT 'Kilogrammes (kg)'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "express_visibility" jsonb NOT NULL DEFAULT '{"showTTC":true,"allowDiscounts":true,"showInventory":false}'`);
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "express_multiplier" SET DEFAULT '1.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" ALTER COLUMN "express_multiplier" SET DEFAULT 1.5`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "express_visibility"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "weight_unit"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "express_enabled"`);
    }

}
