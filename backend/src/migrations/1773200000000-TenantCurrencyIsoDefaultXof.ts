import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migrates tenants.currency from free-form display labels (e.g. "Euro (€)")
 * to ISO 4217 codes, with XOF (FCFA) as the new default.
 */
export class TenantCurrencyIsoDefaultXof1773200000000 implements MigrationInterface {
  name = 'TenantCurrencyIsoDefaultXof1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "tenants" SET "currency" = CASE
        WHEN "currency" IN ('Euro (€)', 'Euro', 'EUR', 'eur') THEN 'EUR'
        WHEN "currency" IN ('Dollar ($)', 'Dollar', 'USD', 'usd') THEN 'USD'
        WHEN "currency" IN ('Livre Sterling (£)', 'Livre Sterling', 'GBP', 'gbp') THEN 'GBP'
        WHEN LENGTH(TRIM("currency")) = 3 THEN UPPER(TRIM("currency"))
        ELSE 'XOF'
      END
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ALTER COLUMN "currency" SET DEFAULT 'XOF'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "tenants" SET "currency" = CASE
        WHEN "currency" = 'EUR' THEN 'Euro (€)'
        WHEN "currency" = 'USD' THEN 'Dollar ($)'
        WHEN "currency" = 'GBP' THEN 'Livre Sterling (£)'
        WHEN "currency" = 'XOF' THEN 'Euro (€)'
        ELSE "currency"
      END
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants"
      ALTER COLUMN "currency" SET DEFAULT 'Euro (€)'
    `);
  }
}
