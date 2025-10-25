import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRewardConversion1759002000000 implements MigrationInterface {
  name = 'AddRewardConversion1759002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reward_settings" ADD COLUMN IF NOT EXISTS "conversion" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reward_settings" DROP COLUMN IF EXISTS "conversion"`,
    );
  }
}
