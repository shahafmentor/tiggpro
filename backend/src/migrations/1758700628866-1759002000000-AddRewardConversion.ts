import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRewardConversion1758700628866 implements MigrationInterface {
  name = 'AddRewardConversion1758700628866';

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
