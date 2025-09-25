import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveGamingTimeFields1758772999911 implements MigrationInterface {
    name = 'RemoveGamingTimeFields1758772999911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_points" DROP COLUMN "available_gaming_minutes"`);
        await queryRunner.query(`ALTER TABLE "user_points" DROP COLUMN "used_gaming_minutes"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_points" ADD "used_gaming_minutes" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_points" ADD "available_gaming_minutes" integer NOT NULL DEFAULT '0'`);
    }

}
