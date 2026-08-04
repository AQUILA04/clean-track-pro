import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlotType1772000000000 implements MigrationInterface {
    name = 'AddSlotType1772000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."storage_slots_slot_type_enum" AS ENUM('RECEPTION', 'DELIVERY')
        `);
        await queryRunner.query(`
            ALTER TABLE "storage_slots"
            ADD COLUMN "slot_type" "public"."storage_slots_slot_type_enum" NOT NULL DEFAULT 'RECEPTION'
        `);
        // Mark B-series slots as delivery-ready shelves
        await queryRunner.query(`
            UPDATE "storage_slots" SET "slot_type" = 'DELIVERY' WHERE name LIKE 'B-%'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "storage_slots" DROP COLUMN "slot_type"`);
        await queryRunner.query(`DROP TYPE "public"."storage_slots_slot_type_enum"`);
    }
}
