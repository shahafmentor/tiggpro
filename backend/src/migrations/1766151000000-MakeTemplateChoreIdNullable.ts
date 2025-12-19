import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTemplateChoreIdNullable1766151000000
  implements MigrationInterface
{
  name = 'MakeTemplateChoreIdNullable1766151000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chore_instances" ALTER COLUMN "template_chore_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill any NULL template_chore_id by creating a template chore from the instance snapshot.
    await queryRunner.query(
      `CREATE TEMP TABLE "tmp_chore_template_backfill" ("instance_id" uuid PRIMARY KEY, "template_chore_id" uuid NOT NULL)`,
    );

    await queryRunner.query(
      `INSERT INTO "tmp_chore_template_backfill" ("instance_id", "template_chore_id")
       SELECT ci."id", uuid_generate_v4()
       FROM "chore_instances" ci
       WHERE ci."template_chore_id" IS NULL`,
    );

    await queryRunner.query(
      `INSERT INTO "chores" (
          "id",
          "tenant_id",
          "title",
          "description",
          "points_reward",
          "difficulty_level",
          "estimated_duration_minutes",
          "is_recurring",
          "recurrence_pattern",
          "created_by",
          "is_active",
          "created_at",
          "updated_at"
        )
       SELECT
          tmp."template_chore_id",
          ci."tenant_id",
          ci."title",
          ci."description",
          ci."points_reward",
          ci."difficulty_level",
          ci."estimated_duration_minutes",
          ci."is_recurring",
          ci."recurrence_pattern",
          ci."created_by",
          true,
          ci."created_at",
          ci."updated_at"
       FROM "tmp_chore_template_backfill" tmp
       JOIN "chore_instances" ci ON ci."id" = tmp."instance_id"`,
    );

    await queryRunner.query(
      `UPDATE "chore_instances" ci
       SET "template_chore_id" = tmp."template_chore_id"
       FROM "tmp_chore_template_backfill" tmp
       WHERE ci."id" = tmp."instance_id"`,
    );

    await queryRunner.query(`DROP TABLE "tmp_chore_template_backfill"`);

    await queryRunner.query(
      `ALTER TABLE "chore_instances" ALTER COLUMN "template_chore_id" SET NOT NULL`,
    );
  }
}
