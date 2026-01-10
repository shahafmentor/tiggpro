import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChoreRecurrences1766200000000 implements MigrationInterface {
  name = 'AddChoreRecurrences1766200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the chore_recurrences table
    await queryRunner.query(`
      CREATE TABLE "chore_recurrences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "template_chore_id" uuid NOT NULL,
        "assigned_to" uuid NOT NULL,
        "assigned_by" uuid NOT NULL,
        "recurrence_pattern" jsonb NOT NULL,
        "priority" "public"."priority_enum" NOT NULL DEFAULT 'medium',
        "last_generated_date" date NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chore_recurrences" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for efficient querying
    await queryRunner.query(`
      CREATE INDEX "IDX_chore_recurrences_tenant_id" ON "chore_recurrences" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chore_recurrences_template_chore_id" ON "chore_recurrences" ("template_chore_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chore_recurrences_assigned_to" ON "chore_recurrences" ("assigned_to")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chore_recurrences_is_active" ON "chore_recurrences" ("is_active")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences"
      ADD CONSTRAINT "FK_chore_recurrences_tenant_id"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences"
      ADD CONSTRAINT "FK_chore_recurrences_template_chore_id"
      FOREIGN KEY ("template_chore_id") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences"
      ADD CONSTRAINT "FK_chore_recurrences_assigned_to"
      FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences"
      ADD CONSTRAINT "FK_chore_recurrences_assigned_by"
      FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences" DROP CONSTRAINT IF EXISTS "FK_chore_recurrences_assigned_by"
    `);
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences" DROP CONSTRAINT IF EXISTS "FK_chore_recurrences_assigned_to"
    `);
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences" DROP CONSTRAINT IF EXISTS "FK_chore_recurrences_template_chore_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "chore_recurrences" DROP CONSTRAINT IF EXISTS "FK_chore_recurrences_tenant_id"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chore_recurrences_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chore_recurrences_assigned_to"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chore_recurrences_template_chore_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chore_recurrences_tenant_id"`);

    // Drop the table
    await queryRunner.query(`DROP TABLE IF EXISTS "chore_recurrences"`);
  }
}
