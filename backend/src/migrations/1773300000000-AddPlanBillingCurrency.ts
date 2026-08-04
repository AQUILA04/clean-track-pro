import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds billing currency (EUR | USD) to subscription plans.
 * Stripe checkout charges in this currency; signup UI may show converted amounts.
 */
export class AddPlanBillingCurrency1773300000000 implements MigrationInterface {
  name = 'AddPlanBillingCurrency1773300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN IF NOT EXISTS "currency" character varying(3) NOT NULL DEFAULT 'EUR'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "currency"
    `);
  }
}
