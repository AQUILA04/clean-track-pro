import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePgTrgmAndGinIndexes1769350800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pg_trgm extension for trigram-based fuzzy text search
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // Drop existing B-Tree indexes on search fields (first_name, last_name, phone)
        // These were created by TypeORM @Index() decorator but are inefficient for ILIKE '%...%' queries
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_first_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_last_name"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_phone"`);

        // Create GIN indexes with trigram operator class for efficient substring search
        // These support ILIKE '%substring%' queries used in the search endpoint
        await queryRunner.query(`
            CREATE INDEX "IDX_clients_first_name_gin_trgm" 
            ON clients USING GIN (first_name gin_trgm_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clients_last_name_gin_trgm" 
            ON clients USING GIN (last_name gin_trgm_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_clients_phone_gin_trgm" 
            ON clients USING GIN (phone gin_trgm_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop GIN indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_first_name_gin_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_last_name_gin_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clients_phone_gin_trgm"`);

        // Recreate B-Tree indexes (restore to previous state)
        await queryRunner.query(`CREATE INDEX "IDX_clients_first_name" ON clients (first_name)`);
        await queryRunner.query(`CREATE INDEX "IDX_clients_last_name" ON clients (last_name)`);
        await queryRunner.query(`CREATE INDEX "IDX_clients_phone" ON clients (phone)`);

        // Note: We don't drop pg_trgm extension in down() as other tables might use it
        // Manual cleanup required if needed: DROP EXTENSION IF EXISTS pg_trgm;
    }

}
