import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveGamingTimeFields1758772999911 implements MigrationInterface {
    name = 'RemoveGamingTimeFields1758772999911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_points" DROP COLUMN "available_gaming_minutes"`);
        await queryRunner.query(`ALTER TABLE "user_points" DROP COLUMN "used_gaming_minutes"`);
        await queryRunner.query(`ALTER TABLE "chores" DROP COLUMN "gaming_time_minutes"`);
        await queryRunner.query(`ALTER TABLE "chore_submissions" DROP COLUMN "gaming_time_awarded"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chore_submissions" ADD "gaming_time_awarded" integer`);
        await queryRunner.query(`ALTER TABLE "chores" ADD "gaming_time_minutes" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_points" ADD "used_gaming_minutes" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_points" ADD "available_gaming_minutes" integer NOT NULL DEFAULT '0'`);
    }

}
