import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRewards1759000000000 implements MigrationInterface {
  name = 'AddRewards1759000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums for rewards
    await queryRunner.query(
      `CREATE TYPE "public"."reward_type_enum" AS ENUM('gaming_time', 'social_outing', 'spending_money', 'special_experience')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."redemption_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );

    // Create reward_settings table (one per tenant)
    await queryRunner.query(
      `CREATE TABLE "reward_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "enabled_types" text NOT NULL DEFAULT '',
        "default_conversion" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reward_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reward_settings_tenant" UNIQUE ("tenant_id")
      )`,
    );

    // Create reward_redemptions table
    await queryRunner.query(
      `CREATE TABLE "reward_redemptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "type" "public"."reward_type_enum" NOT NULL,
        "amount" integer,
        "notes" text,
        "status" "public"."redemption_status_enum" NOT NULL DEFAULT 'pending',
        "requested_at" TIMESTAMP NOT NULL DEFAULT now(),
        "decided_at" TIMESTAMP,
        "decided_by" uuid,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reward_redemptions" PRIMARY KEY ("id")
      )`,
    );

    // Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_reward_redemptions_tenant_user" ON "reward_redemptions" ("tenant_id", "user_id")`,
    );

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "reward_settings" ADD CONSTRAINT "FK_reward_settings_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_redemptions" ADD CONSTRAINT "FK_reward_redemptions_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_redemptions" ADD CONSTRAINT "FK_reward_redemptions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_redemptions" ADD CONSTRAINT "FK_reward_redemptions_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs
    await queryRunner.query(
      `ALTER TABLE "reward_redemptions" DROP CONSTRAINT "FK_reward_redemptions_decided_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_redemptions" DROP CONSTRAINT "FK_reward_redemptions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_redemptions" DROP CONSTRAINT "FK_reward_redemptions_tenant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reward_settings" DROP CONSTRAINT "FK_reward_settings_tenant_id"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_reward_redemptions_tenant_user"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "reward_redemptions"`);
    await queryRunner.query(`DROP TABLE "reward_settings"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."redemption_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reward_type_enum"`);
  }
}
