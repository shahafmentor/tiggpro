# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tiggpro is a gamified chore management app for families, built as a monorepo with three workspaces:

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Nest.js with TypeORM, PostgreSQL, Redis, and JWT authentication
- **Shared**: Common TypeScript types and utilities used by both frontend and backend

## Essential Commands

### Development
```bash
# Start both frontend and backend in development mode
npm run dev

# Start individual services
npm run dev:frontend    # http://localhost:3000
npm run dev:backend     # http://localhost:3001

# Database setup (required before first run)
npm run db:setup        # Start PostgreSQL and Redis containers
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed with sample data (optional)
```

### Code Quality
```bash
# Lint all packages
npm run lint

# Type check all packages
npm run type-check

# Format code with Prettier
npm run format

# Build all packages
npm run build
```

### Testing
```bash
# Backend tests
cd backend && npm run test
cd backend && npm run test:e2e

# No frontend tests currently configured
```

### Database Management
```bash
# TypeORM migration commands (run from backend directory)
cd backend && npm run migration:generate -- MigrationName
cd backend && npm run migration:run
cd backend && npm run migration:revert
```

## Architecture Overview

### Multi-tenant System
The app uses a tenant-based architecture where:
- Users belong to tenants (families)
- All data is scoped to tenants
- Role-based access control (RBAC) with Parent/Admin and Child roles
- Tenant membership is enforced via guards and decorators

### Key Backend Modules
- `auth/` - JWT authentication, user management, RBAC guards
- `tenants/` - Family/tenant management, member invitations
- `chores/` - Chore creation, assignment, management
- `assignments/` - Chore assignment lifecycle, submissions, reviews
- `gamification/` - Points system, achievements
- `rewards/` - Reward redemption system with parent approval
- `health/` - Health checks and monitoring

### Frontend Architecture
- App Router with internationalization (next-intl)
- Zustand for state management
- TanStack Query for server state
- shadcn/ui component library
- Multi-theme support (light/dark)

### Database Schema
Key entities:
- `User` - User accounts with authentication data
- `Tenant` - Family/group containers
- `TenantMember` - User-tenant relationships with roles
- `Chore` - Chore definitions with point values
- `ChoreAssignment` - Individual chore assignments
- `ChoreSubmission` - Completion submissions for review
- `UserPoints` - Points balances per user/tenant
- `Achievement` - Achievement definitions and user achievements
- `RewardRedemption` - Reward requests requiring approval

## Development Patterns

### Backend Conventions
- Use DTOs with class-validator for request validation
- Apply guards for authentication, authorization, and tenant scoping
- Entity relationships use proper TypeORM decorators
- All database queries should be tenant-scoped
- Use proper HTTP status codes and error handling

### Frontend Conventions
- Components follow shadcn/ui patterns
- Forms use react-hook-form with zod validation
- API calls use TanStack Query with proper error handling
- State management with Zustand stores
- Internationalization keys in `messages/` directory

### Shared Package
The shared package (`shared/`) contains:
- Common TypeScript types and interfaces
- Shared utilities and constants
- Build shared package before running frontend/backend: `npm run build:shared`

## Important Development Notes

### Environment Setup
- Node.js 18+ required
- Docker required for local PostgreSQL and Redis
- Environment files: `backend/.env` and `frontend/.env.local`

### Database Migrations
- Always generate migrations for schema changes
- Review generated migrations before running
- Migrations are in `backend/src/migrations/`

### Multi-tenancy
- All API endpoints require tenant context
- Use `@TenantMember()` decorator for tenant-scoped operations
- Guards automatically filter data by tenant

### Authentication Flow
- JWT-based authentication
- Role-based permissions (Parent/Admin vs Child)
- Guards handle authentication, authorization, and tenant membership

### Points and Rewards System
- Points awarded for completed chores
- Achievements unlock based on milestones
- Reward redemptions require parent/admin approval
- Points balances are tenant-scoped

## Common Development Tasks

### Adding New Features
1. Update shared types if needed
2. Create/update backend entities and DTOs
3. Add database migrations
4. Implement backend services and controllers
5. Create frontend components and forms
6. Update navigation and routing
7. Add proper error handling and validation

### Debugging
- Backend logs available in console
- Frontend dev tools with React Query devtools
- Database can be inspected via Docker: `docker exec -it postgres psql -U tiggpro_user -d tiggpro_dev`

### Performance Considerations
- Use TanStack Query for efficient data fetching
- Implement proper pagination for lists
- Consider Redis caching for frequently accessed data
- Use TypeORM query builder for complex queries