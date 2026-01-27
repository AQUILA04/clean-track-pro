import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIconToArticleTypes1769545761984 implements MigrationInterface {
    name = 'AddIconToArticleTypes1769545761984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Only add the icon column, other tables/indexes are handled by previous migrations
        await queryRunner.query(`ALTER TABLE "article_types" ADD "icon" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article_types" DROP COLUMN "icon"`);
    }

}
