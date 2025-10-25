# Database Migrations Guide

This guide explains how to safely create, manage, and run database migrations for the Tiggpro backend.

## Table of Contents
- [Why Migration Order Matters](#why-migration-order-matters)
- [Creating New Migrations](#creating-new-migrations)
- [Running Migrations](#running-migrations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Why Migration Order Matters

TypeORM runs migrations in **ascending timestamp order**. This means:
- Migration `1758700628866-CreateUsers.ts` runs BEFORE `1759000000000-AddUserEmail.ts`
- If you manually create migrations with old timestamps, they may try to run before their dependencies exist

### Real Example of Migration Ordering Issues

In our codebase, we encountered this issue:
```
❌ 1758700628866-AddRewardConversion  (tried to ALTER reward_settings)
✅ 1759000000000-AddRewards           (creates reward_settings table)
```

This caused the error: `relation "reward_settings" does not exist`

**Solution:** Renamed the migration to `1759002000000-AddRewardConversion` to run AFTER table creation.

## Creating New Migrations

### Option 1: Safe Manual Creation (Recommended)

Use the built-in script that ensures proper timestamp ordering:

```bash
cd backend
npm run migration:create:safe -- MigrationName
```

This script:
- ✅ Checks the latest existing migration timestamp
- ✅ Ensures new migration timestamp is always newer
- ✅ Shows you the migration order
- ✅ Creates a properly structured migration file

Example:
```bash
npm run migration:create:safe -- AddUserPreferences
```

Output:
```
✓ Migration created successfully:
  src/migrations/1761394483270-AddUserPreferences.ts

Migration order:
    1759000000000-AddRewards.ts
    1759002000000-AddRewardConversion.ts
  → 1761394483270-AddUserPreferences.ts (NEW)
```

### Option 2: TypeORM Auto-Generation

Generate a migration from entity changes:

```bash
npm run migration:generate -- src/migrations/MigrationName
```

**Note:** This uses the current timestamp, which is usually safe but doesn't guarantee ordering if run quickly in succession.

### Option 3: Manual TypeORM Creation

```bash
npm run migration:create -- src/migrations/MigrationName
```

**⚠️ Warning:** This uses the current timestamp. If you create multiple migrations quickly, they may have very close timestamps.

## Running Migrations

### Development (Local)

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Check migration order
npm run migration:check-order
```

### Production (Cloud Run)

Migrations run automatically on deployment via the startup script:
```bash
# In scripts/start-prod.sh
npm run migration:run
```

## Best Practices

### 1. Always Create Tables Before Altering Them

```typescript
// ✅ CORRECT ORDER
// Migration 1759000000000-CreateUsers.ts
export class CreateUsers1759000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "users" (...)`);
  }
}

// Migration 1759001000000-AddUserEmail.ts
export class AddUserEmail1759001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email" varchar`);
  }
}
```

### 2. Use IF NOT EXISTS / IF EXISTS for Idempotency

```typescript
// ✅ Good - Safe to run multiple times
await queryRunner.query(`CREATE TABLE IF NOT EXISTS "users" (...)`);
await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar`);

// ❌ Bad - Will fail if already exists
await queryRunner.query(`CREATE TABLE "users" (...)`);
await queryRunner.query(`CREATE EXTENSION "uuid-ossp"`);
```

### 3. Always Implement down() Method

```typescript
export class AddUserEmail1759001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "email" varchar`);
  }

  // ✅ Implement rollback logic
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
  }
}
```

### 4. Test Migrations Locally Before Deploying

```bash
# 1. Run migration
npm run migration:run

# 2. Test your application
npm run start:dev

# 3. If issues, rollback
npm run migration:revert
```

### 5. Never Modify Existing Migrations

Once a migration has been deployed to production:
- ❌ Don't edit it
- ❌ Don't delete it
- ✅ Create a new migration to make changes

### 6. Use Transactions Implicitly

TypeORM wraps each migration in a transaction automatically:
- If any query fails, the entire migration rolls back
- Database stays in a consistent state

### 7. Check Migration Order Before Committing

```bash
npm run migration:check-order
```

This lists all migrations in execution order. Verify:
- New migrations appear at the bottom
- Dependencies come before dependent migrations

## Troubleshooting

### "relation does not exist" Error

**Cause:** Migration tries to ALTER a table that hasn't been created yet.

**Solution:**
1. Check migration order: `npm run migration:check-order`
2. Identify which migration creates the table
3. Ensure your ALTER migration has a later timestamp
4. If needed, rename migration file to have a later timestamp

### Migrations Not Running in Production

**Check:**
1. Cloud Run logs for migration errors
2. Ensure `start-prod.sh` calls `npm run migration:run`
3. Verify `ormconfig.ts` has correct database connection
4. Check database permissions

### Migration Stuck or Times Out

**Possible causes:**
- Large data migration taking too long
- Database connection issues
- Lock conflicts with other connections

**Solutions:**
- Increase timeout in Cloud Run configuration
- Break large migrations into smaller chunks
- Run during low-traffic periods

### Duplicate Migration Timestamps

If you accidentally create migrations with the same timestamp:

```bash
# Rename the file
mv src/migrations/1759000000000-Duplicate.ts src/migrations/1759001000000-Duplicate.ts

# Update class name and name property in the file
export class Duplicate1759001000000 implements MigrationInterface {
  name = 'Duplicate1759001000000';
```

## Migration Naming Conventions

Use descriptive names that indicate what the migration does:

✅ Good names:
- `AddUserEmailColumn`
- `CreateRewardsTable`
- `RemoveGamingTimeFields`
- `AddIndexToChoresAssignments`

❌ Bad names:
- `Migration1`
- `Update`
- `Changes`
- `Fix`

## Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Supabase Migration Guide](https://supabase.com/docs/guides/database/migrations)
