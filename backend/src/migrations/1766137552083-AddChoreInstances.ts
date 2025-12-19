import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChoreInstances1766137552083 implements MigrationInterface {
  name = 'AddChoreInstances1766137552083';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chore_instances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "template_chore_id" uuid NOT NULL, "title" character varying NOT NULL, "description" text, "points_reward" integer NOT NULL, "difficulty_level" "public"."difficulty_level_enum" NOT NULL DEFAULT 'medium', "estimated_duration_minutes" integer NOT NULL, "is_recurring" boolean NOT NULL DEFAULT false, "recurrence_pattern" jsonb, "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chore_instances" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_chore_instances_tenant_id" ON "chore_instances" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chore_instances_template_chore_id" ON "chore_instances" ("template_chore_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "chore_instances" ADD CONSTRAINT "FK_chore_instances_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_instances" ADD CONSTRAINT "FK_chore_instances_template_chore_id" FOREIGN KEY ("template_chore_id") REFERENCES "chores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_instances" ADD CONSTRAINT "FK_chore_instances_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 1) Add nullable chore_instance_id to assignments
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD COLUMN "chore_instance_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD CONSTRAINT "FK_chore_assignments_chore_instance_id" FOREIGN KEY ("chore_instance_id") REFERENCES "chore_instances"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 2) Backfill: create one instance per existing assignment and connect it
    await queryRunner.query(
      `CREATE TEMP TABLE "tmp_chore_instance_backfill" ("assignment_id" uuid PRIMARY KEY, "chore_instance_id" uuid NOT NULL)`,
    );

    await queryRunner.query(
      `INSERT INTO "tmp_chore_instance_backfill" ("assignment_id", "chore_instance_id")
       SELECT "id", uuid_generate_v4()
       FROM "chore_assignments"
       WHERE "chore_instance_id" IS NULL`,
    );

    await queryRunner.query(
      `INSERT INTO "chore_instances" ("id", "tenant_id", "template_chore_id", "title", "description", "points_reward", "difficulty_level", "estimated_duration_minutes", "is_recurring", "recurrence_pattern", "created_by", "created_at", "updated_at")
       SELECT tmp."chore_instance_id",
              c."tenant_id",
              c."id",
              c."title",
              c."description",
              c."points_reward",
              c."difficulty_level",
              c."estimated_duration_minutes",
              c."is_recurring",
              c."recurrence_pattern",
              a."assigned_by",
              a."created_at",
              a."updated_at"
       FROM "tmp_chore_instance_backfill" tmp
       JOIN "chore_assignments" a ON a."id" = tmp."assignment_id"
       JOIN "chores" c ON c."id" = a."chore_id"`,
    );

    await queryRunner.query(
      `UPDATE "chore_assignments" a
       SET "chore_instance_id" = tmp."chore_instance_id"
       FROM "tmp_chore_instance_backfill" tmp
       WHERE a."id" = tmp."assignment_id"`,
    );

    await queryRunner.query(`DROP TABLE "tmp_chore_instance_backfill"`);

    // 3) Enforce NOT NULL and index
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ALTER COLUMN "chore_instance_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_chore_assignments_chore_instance_id" ON "chore_assignments" ("chore_instance_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_chore_assignments_chore_instance_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP CONSTRAINT "FK_chore_assignments_chore_instance_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP COLUMN "chore_instance_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "chore_instances" DROP CONSTRAINT "FK_chore_instances_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_instances" DROP CONSTRAINT "FK_chore_instances_template_chore_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_instances" DROP CONSTRAINT "FK_chore_instances_tenant_id"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_chore_instances_template_chore_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_chore_instances_tenant_id"`);

    await queryRunner.query(`DROP TABLE "chore_instances"`);
  }
}

