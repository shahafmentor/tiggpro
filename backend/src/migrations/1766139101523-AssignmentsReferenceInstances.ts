import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssignmentsReferenceInstances1766139101523
  implements MigrationInterface
{
  name = 'AssignmentsReferenceInstances1766139101523';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old template FK and column
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP CONSTRAINT "FK_chore_assignments_chore_id"`,
    );
    await queryRunner.query(`ALTER TABLE "chore_assignments" DROP COLUMN "chore_id"`);

    // Drop instance FK/index (we'll recreate with the new column name)
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP CONSTRAINT "FK_chore_assignments_chore_instance_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_chore_assignments_chore_instance_id"`,
    );

    // Rename chore_instance_id -> chore_id (now points to chore_instances)
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" RENAME COLUMN "chore_instance_id" TO "chore_id"`,
    );

    // Recreate FK + index for the new column name
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD CONSTRAINT "FK_chore_assignments_chore_id" FOREIGN KEY ("chore_id") REFERENCES "chore_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chore_assignments_chore_id" ON "chore_assignments" ("chore_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK/index to instances on chore_id
    await queryRunner.query(
      `DROP INDEX "public"."IDX_chore_assignments_chore_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP CONSTRAINT "FK_chore_assignments_chore_id"`,
    );

    // Rename chore_id -> chore_instance_id
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" RENAME COLUMN "chore_id" TO "chore_instance_id"`,
    );

    // Recreate FK/index to instances on chore_instance_id
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD CONSTRAINT "FK_chore_assignments_chore_instance_id" FOREIGN KEY ("chore_instance_id") REFERENCES "chore_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chore_assignments_chore_instance_id" ON "chore_assignments" ("chore_instance_id")`,
    );

    // Recreate template chore_id column and backfill from instance.template_chore_id
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD COLUMN "chore_id" uuid`,
    );
    await queryRunner.query(
      `UPDATE "chore_assignments" a
       SET "chore_id" = ci."template_chore_id"
       FROM "chore_instances" ci
       WHERE ci."id" = a."chore_instance_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ALTER COLUMN "chore_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD CONSTRAINT "FK_chore_assignments_chore_id" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

