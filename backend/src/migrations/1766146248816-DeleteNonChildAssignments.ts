import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeleteNonChildAssignments1766146248816
  implements MigrationInterface
{
  name = 'DeleteNonChildAssignments1766146248816';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Identify assignments whose assignee is a tenant member with role ADMIN or PARENT
    // (joined via chore_instances.tenant_id, since assignments don't store tenant_id directly).
    await queryRunner.query(
      `
      CREATE TEMP TABLE "tmp_invalid_assignments" AS
      SELECT a."id" AS "assignment_id", a."chore_id" AS "chore_instance_id"
      FROM "chore_assignments" a
      JOIN "chore_instances" ci ON ci."id" = a."chore_id"
      JOIN "tenant_members" tm
        ON tm."tenant_id" = ci."tenant_id"
       AND tm."user_id" = a."assigned_to"
       AND tm."is_active" = true
      WHERE tm."role" IN ('admin', 'parent')
      `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tmp_invalid_assignments_assignment_id" ON "tmp_invalid_assignments" ("assignment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tmp_invalid_assignments_chore_instance_id" ON "tmp_invalid_assignments" ("chore_instance_id")`,
    );

    // 1) Delete submissions for invalid assignments
    await queryRunner.query(
      `
      DELETE FROM "chore_submissions" s
      USING "tmp_invalid_assignments" t
      WHERE s."assignment_id" = t."assignment_id"
      `,
    );

    // 2) Delete invalid assignments
    await queryRunner.query(
      `
      DELETE FROM "chore_assignments" a
      USING "tmp_invalid_assignments" t
      WHERE a."id" = t."assignment_id"
      `,
    );

    // 3) Delete orphaned instances that were referenced by invalid assignments and are now unreferenced
    await queryRunner.query(
      `
      DELETE FROM "chore_instances" ci
      USING "tmp_invalid_assignments" t
      WHERE ci."id" = t."chore_instance_id"
        AND NOT EXISTS (
          SELECT 1
          FROM "chore_assignments" a
          WHERE a."chore_id" = ci."id"
        )
      `,
    );

    await queryRunner.query(`DROP TABLE "tmp_invalid_assignments"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Data deletion is not reversible.
    // Intentionally no-op.
    await queryRunner.query(`SELECT 1`);
  }
}

