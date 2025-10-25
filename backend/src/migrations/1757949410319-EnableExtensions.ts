import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableExtensions1757949410319 implements MigrationInterface {
  name = 'EnableExtensions1757949410319';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension required for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(): Promise<void> {
    // Don't drop extension as other databases might use it
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
