# Tiggpro Backend

NestJS backend API for the Tiggpro family chore management application.

## Overview

This backend provides REST APIs and WebSocket connections for managing chores, gamification, rewards, and family tenant management.

## Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL (via Supabase)
- **ORM:** TypeORM 0.3
- **Authentication:** JWT with Passport
- **Real-time:** Socket.io
- **Cache:** Redis (optional)
- **Deployment:** Google Cloud Run

## Project Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

## Development

```bash
# Start in development mode with hot reload
npm run start:dev

# Build the project
npm run build

# Start in production mode
npm run start:prod
```

## Database Migrations

**⚠️ Important:** Always use the safe migration creation script to ensure proper ordering.

```bash
# Create a new migration (RECOMMENDED)
npm run migration:create:safe -- MigrationName

# Generate migration from entity changes
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Check migration order
npm run migration:check-order
```

**📖 See [MIGRATIONS.md](./MIGRATIONS.md) for detailed migration guide and best practices.**

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Code Quality

```bash
# Run linter
npm run lint

# Type check
npm run type-check

# Format code
npm run format
```

## API Documentation

When running in development, Swagger documentation is available at:
```
http://localhost:3001/api/docs
```

## Key Modules

### Authentication (`src/auth`)
- JWT-based authentication
- OAuth providers (Google, Apple, Facebook, Microsoft)
- Role-based access control (RBAC)
- Guards for authentication and authorization

### Tenants (`src/tenants`)
- Family/group management
- Member invitations with codes
- Role assignment (Admin, Parent, Child)
- Multi-tenant data isolation

### Chores (`src/chores`)
- Chore creation and management
- Difficulty levels and point rewards
- Recurring chore patterns
- Assignment to family members

### Assignments (`src/assignments`)
- Chore assignment lifecycle
- Submission with media attachments
- Parent review and approval
- Status tracking (pending, submitted, approved, rejected, overdue)

### Gamification (`src/gamification`)
- Points system
- Achievement tracking
- Leaderboards
- Streak counting
- User levels

### Rewards (`src/rewards`)
- Reward redemption requests
- Parent approval workflow
- Points conversion
- Reward types (gaming time, outings, spending money, experiences)

### Health (`src/health`)
- Health check endpoints
- Database connectivity check
- Readiness and liveness probes

## Environment Variables

Required environment variables:

```env
# Node environment
NODE_ENV=development

# Server
PORT=3001

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Deployment

### Docker Build

```bash
# Build backend image
docker build -f backend/Dockerfile -t tiggpro-backend .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  tiggpro-backend
```

### Google Cloud Run

Deployed automatically via GitHub Actions on push to main branch.

See [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) for deployment configuration.

## Architecture Notes

### Multi-Tenancy

All data is scoped to tenants (families). Key patterns:

1. **Entities** have `tenantId` foreign key
2. **Guards** enforce tenant membership
3. **Decorators** (`@TenantMember()`) inject tenant context
4. **Queries** always filter by tenant

### Authentication Flow

1. User authenticates via OAuth provider
2. Backend creates/updates user record
3. JWT access token (15min) and refresh token (7d) issued
4. Subsequent requests use Bearer token
5. Guards validate JWT and extract user context

### Real-time Updates

Socket.io connections for real-time notifications:
- Chore assignments
- Submission reviews
- Reward requests
- Achievement unlocks

## Common Development Tasks

### Adding a New Endpoint

1. Create DTO in `src/<module>/dto/`
2. Add method to controller
3. Implement business logic in service
4. Add proper guards for authentication/authorization
5. Update Swagger decorators

### Adding a New Entity

1. Create entity in `src/<module>/entities/`
2. Add to module's `imports` in TypeORM config
3. Generate migration: `npm run migration:generate -- src/migrations/Add<Entity>`
4. Review and test migration
5. Run migration: `npm run migration:run`

### Debugging Database Queries

Enable query logging in `src/app.module.ts`:

```typescript
TypeOrmModule.forRoot({
  // ...
  logging: true,
  logger: 'advanced-console',
})
```

## Troubleshooting

### Migration Errors

See [MIGRATIONS.md](./MIGRATIONS.md) for detailed troubleshooting.

### Connection Issues

```bash
# Test database connection
npm run test:db
```

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Supabase Documentation](https://supabase.com/docs)
- [Project CLAUDE.md](../CLAUDE.md) - Development guidelines

## License

Private - Tiggpro Project
