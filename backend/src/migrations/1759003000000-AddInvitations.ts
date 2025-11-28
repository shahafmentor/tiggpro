import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInvitations1759003000000 implements MigrationInterface {
  name = 'AddInvitations1759003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invitation status enum
    await queryRunner.query(
      `CREATE TYPE "public"."invitation_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED')`,
    );

    // Create invitations table
    await queryRunner.query(
      `CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "tenant_id" uuid NOT NULL,
        "role" "public"."tenant_member_role_enum" NOT NULL DEFAULT 'child',
        "invited_by" uuid NOT NULL,
        "message" text,
        "token" character varying NOT NULL,
        "status" "public"."invitation_status_enum" NOT NULL DEFAULT 'PENDING',
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invitations" PRIMARY KEY ("id")
      )`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_email" ON "invitations" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_email_tenant" ON "invitations" ("email", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_invitations_token" ON "invitations" ("token")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_invitations_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_tenant_id"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_invitations_token"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_invitations_email_tenant"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_invitations_email"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "invitations"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."invitation_status_enum"`);
  }
}

