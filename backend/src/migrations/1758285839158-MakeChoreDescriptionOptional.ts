import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeChoreDescriptionOptional1758285839158 implements MigrationInterface {
    name = 'MakeChoreDescriptionOptional1758285839158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chores" ALTER COLUMN "description" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chores" ALTER COLUMN "description" SET NOT NULL`);
    }

}
