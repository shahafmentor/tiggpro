import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPointsBalance1758700281930 implements MigrationInterface {
  name = 'AddPointsBalance1758700281930';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_points" ADD COLUMN "available_points" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_points" ADD COLUMN "spent_points" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `UPDATE "user_points" SET "available_points" = "total_points" WHERE "available_points" = 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_points" DROP COLUMN "spent_points"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_points" DROP COLUMN "available_points"`,
    );
  }
}
