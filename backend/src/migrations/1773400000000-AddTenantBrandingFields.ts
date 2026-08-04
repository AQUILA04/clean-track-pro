import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * White-label branding fields for tenants:
 * logo, favicon, headquarters address, and legal identifiers.
 */
export class AddTenantBrandingFields1773400000000 implements MigrationInterface {
  name = 'AddTenantBrandingFields1773400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "logoUrl" character varying,
      ADD COLUMN IF NOT EXISTS "faviconUrl" character varying,
      ADD COLUMN IF NOT EXISTS "address" text,
      ADD COLUMN IF NOT EXISTS "legal_id" character varying,
      ADD COLUMN IF NOT EXISTS "vat_number" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tenants"
      DROP COLUMN IF EXISTS "logoUrl",
      DROP COLUMN IF EXISTS "faviconUrl",
      DROP COLUMN IF EXISTS "address",
      DROP COLUMN IF EXISTS "legal_id",
      DROP COLUMN IF EXISTS "vat_number"
    `);
  }
}
