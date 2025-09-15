import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1757949410320 implements MigrationInterface {
  name = 'InitialSchema1757949410320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM types
    await queryRunner.query(
      `CREATE TYPE "public"."auth_provider_enum" AS ENUM('google', 'apple', 'facebook', 'microsoft')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_type_enum" AS ENUM('family')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tenant_member_role_enum" AS ENUM('admin', 'parent', 'child')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."difficulty_level_enum" AS ENUM('easy', 'medium', 'hard')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."priority_enum" AS ENUM('low', 'medium', 'high')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."assignment_status_enum" AS ENUM('pending', 'submitted', 'approved', 'rejected', 'overdue')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."review_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."requirement_type_enum" AS ENUM('streak', 'points', 'chores_completed', 'level')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum" AS ENUM('chore_assigned', 'submission_pending', 'chore_approved', 'chore_rejected', 'achievement_earned')`,
    );

    // Create users table
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "display_name" character varying NOT NULL, "avatar_url" character varying, "google_id" character varying, "apple_id" character varying, "provider" "public"."auth_provider_enum" NOT NULL DEFAULT 'google', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_users_google_id" UNIQUE ("google_id"), CONSTRAINT "UQ_users_apple_id" UNIQUE ("apple_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_google_id" ON "users" ("google_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_apple_id" ON "users" ("apple_id") `,
    );

    // Create tenants table
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "tenant_code" character varying NOT NULL, "type" "public"."tenant_type_enum" NOT NULL DEFAULT 'family', "created_by" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_tenants_tenant_code" UNIQUE ("tenant_code"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_tenant_code" ON "tenants" ("tenant_code") `,
    );

    // Create tenant_members table
    await queryRunner.query(
      `CREATE TABLE "tenant_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."tenant_member_role_enum" NOT NULL DEFAULT 'child', "invited_by" uuid, "is_active" boolean NOT NULL DEFAULT true, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_tenant_members_tenant_user" UNIQUE ("tenant_id", "user_id"), CONSTRAINT "PK_tenant_members" PRIMARY KEY ("id"))`,
    );

    // Create chores table
    await queryRunner.query(
      `CREATE TABLE "chores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "points_reward" integer NOT NULL, "gaming_time_minutes" integer NOT NULL, "difficulty_level" "public"."difficulty_level_enum" NOT NULL DEFAULT 'medium', "estimated_duration_minutes" integer NOT NULL, "is_recurring" boolean NOT NULL DEFAULT false, "recurrence_pattern" jsonb, "created_by" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chores" PRIMARY KEY ("id"))`,
    );

    // Create chore_assignments table
    await queryRunner.query(
      `CREATE TABLE "chore_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chore_id" uuid NOT NULL, "assigned_to" uuid NOT NULL, "assigned_by" uuid NOT NULL, "due_date" date NOT NULL, "priority" "public"."priority_enum" NOT NULL DEFAULT 'medium', "status" "public"."assignment_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_chore_assignments" PRIMARY KEY ("id"))`,
    );

    // Create chore_submissions table
    await queryRunner.query(
      `CREATE TABLE "chore_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "assignment_id" uuid NOT NULL, "submitted_by" uuid NOT NULL, "submission_notes" text, "media_urls" jsonb NOT NULL DEFAULT '[]', "submitted_at" TIMESTAMP NOT NULL DEFAULT now(), "reviewed_at" TIMESTAMP, "reviewed_by" uuid, "review_status" "public"."review_status_enum" NOT NULL DEFAULT 'pending', "review_feedback" text, "points_awarded" integer, "gaming_time_awarded" integer, CONSTRAINT "PK_chore_submissions" PRIMARY KEY ("id"))`,
    );

    // Create user_points table
    await queryRunner.query(
      `CREATE TABLE "user_points" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "total_points" integer NOT NULL DEFAULT '0', "available_gaming_minutes" integer NOT NULL DEFAULT '0', "used_gaming_minutes" integer NOT NULL DEFAULT '0', "current_streak_days" integer NOT NULL DEFAULT '0', "longest_streak_days" integer NOT NULL DEFAULT '0', "level" integer NOT NULL DEFAULT '1', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_points_user_tenant" UNIQUE ("user_id", "tenant_id"), CONSTRAINT "PK_user_points" PRIMARY KEY ("id"))`,
    );

    // Create achievements table
    await queryRunner.query(
      `CREATE TABLE "achievements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "icon_url" character varying NOT NULL, "badge_color" character varying NOT NULL, "requirement_type" "public"."requirement_type_enum" NOT NULL, "requirement_value" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_achievements" PRIMARY KEY ("id"))`,
    );

    // Create user_achievements table
    await queryRunner.query(
      `CREATE TABLE "user_achievements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "achievement_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "earned_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_achievements_unique" UNIQUE ("user_id", "achievement_id", "tenant_id"), CONSTRAINT "PK_user_achievements" PRIMARY KEY ("id"))`,
    );

    // Create notifications table
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "type" "public"."notification_type_enum" NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "data" jsonb, "is_read" boolean NOT NULL DEFAULT false, "sent_at" TIMESTAMP NOT NULL DEFAULT now(), "read_at" TIMESTAMP, CONSTRAINT "PK_notifications" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read") `,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "FK_tenants_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_members" ADD CONSTRAINT "FK_tenant_members_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_members" ADD CONSTRAINT "FK_tenant_members_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_members" ADD CONSTRAINT "FK_tenant_members_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" ADD CONSTRAINT "FK_chores_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" ADD CONSTRAINT "FK_chores_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD CONSTRAINT "FK_chore_assignments_chore_id" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD CONSTRAINT "FK_chore_assignments_assigned_to" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" ADD CONSTRAINT "FK_chore_assignments_assigned_by" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_submissions" ADD CONSTRAINT "FK_chore_submissions_assignment_id" FOREIGN KEY ("assignment_id") REFERENCES "chore_assignments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_submissions" ADD CONSTRAINT "FK_chore_submissions_submitted_by" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_submissions" ADD CONSTRAINT "FK_chore_submissions_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_points" ADD CONSTRAINT "FK_user_points_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_points" ADD CONSTRAINT "FK_user_points_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_user_achievements_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_user_achievements_achievement_id" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_achievements" ADD CONSTRAINT "FK_user_achievements_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_achievements" DROP CONSTRAINT "FK_user_achievements_tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_achievements" DROP CONSTRAINT "FK_user_achievements_achievement_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_achievements" DROP CONSTRAINT "FK_user_achievements_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_points" DROP CONSTRAINT "FK_user_points_tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_points" DROP CONSTRAINT "FK_user_points_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_submissions" DROP CONSTRAINT "FK_chore_submissions_reviewed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_submissions" DROP CONSTRAINT "FK_chore_submissions_submitted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_submissions" DROP CONSTRAINT "FK_chore_submissions_assignment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP CONSTRAINT "FK_chore_assignments_assigned_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP CONSTRAINT "FK_chore_assignments_assigned_to"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chore_assignments" DROP CONSTRAINT "FK_chore_assignments_chore_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" DROP CONSTRAINT "FK_chores_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chores" DROP CONSTRAINT "FK_chores_tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_members" DROP CONSTRAINT "FK_tenant_members_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_members" DROP CONSTRAINT "FK_tenant_members_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_members" DROP CONSTRAINT "FK_tenant_members_tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "FK_tenants_created_by"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_is_read"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_apple_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_google_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_tenants_tenant_code"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "user_achievements"`);
    await queryRunner.query(`DROP TABLE "achievements"`);
    await queryRunner.query(`DROP TABLE "user_points"`);
    await queryRunner.query(`DROP TABLE "chore_submissions"`);
    await queryRunner.query(`DROP TABLE "chore_assignments"`);
    await queryRunner.query(`DROP TABLE "chores"`);
    await queryRunner.query(`DROP TABLE "tenant_members"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop ENUM types
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."requirement_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."review_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."assignment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."difficulty_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_member_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tenant_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."auth_provider_enum"`);
  }
}
