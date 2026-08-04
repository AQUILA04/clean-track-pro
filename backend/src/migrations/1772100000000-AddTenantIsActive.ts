import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIsActive1772100000000 implements MigrationInterface {
    name = 'AddTenantIsActive1772100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "tenants" ADD "is_active" boolean NOT NULL DEFAULT true`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "is_active"`);
    }
}
