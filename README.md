# Tiggpro - Gamified Chore Management App

A family-friendly app for managing chores with gamification elements, built with Next.js, Nest.js, and PostgreSQL.

## 🏗️ Project Structure

```
tiggpro/
├── frontend/          # Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui
├── backend/           # Nest.js API with TypeORM and PostgreSQL
├── shared/            # Shared TypeScript types and utilities
├── docker-compose.yml # Local development database
└── package.json       # Workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+ (LTS)
- npm 10+
- Docker and Docker Compose

### 1. Install Dependencies

```bash
# Install root dependencies and all workspace packages
npm install

# Or install individually
npm install --workspace=frontend
npm install --workspace=backend
npm install --workspace=shared
```

### 2. Set Up Environment Variables

```bash
# Copy environment example files
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env.local  # if created
```

Edit the environment files with your local configuration.

### 3. Start Local Database

```bash
# Start PostgreSQL and Redis containers
npm run db:setup

# Or use Docker Compose directly
docker compose up -d postgres redis
```

### 4. Build Shared Package

```bash
npm run build:shared
```

### 5. Run Database Migrations

```bash
# Once backend is set up with TypeORM
npm run db:migrate
```

### 6. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:frontend  # Runs on http://localhost:3000
npm run dev:backend   # Runs on http://localhost:3001
```

## 📦 Available Scripts

### Root Level Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check all packages

### Database Scripts

- `npm run db:setup` - Start local PostgreSQL container
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Docker Scripts

- `npm run docker:dev` - Start all services with Docker Compose
- `npm run docker:down` - Stop all Docker services

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **React Hook Form** - Form handling
- **Zustand** - State management

### Backend
- **Nest.js 10** - Node.js framework
- **TypeORM** - Database ORM
- **PostgreSQL 16** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Authentication
- **Multer** - File uploads

### Shared
- **TypeScript** - Shared types and interfaces
- **Common utilities** - Shared business logic

## 📁 Key Directories

### Frontend (`/frontend`)
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── forms/       # Form components
├── lib/             # Utilities and configurations
├── hooks/           # Custom React hooks
├── store/           # State management
└── types/           # Frontend-specific types
```

### Backend (`/backend`)
```
src/
├── modules/         # Feature modules
│   ├── auth/       # Authentication module
│   ├── users/      # User management
│   ├── families/   # Family management
│   ├── chores/     # Chore management
│   └── gamification/ # Points, achievements, etc.
├── common/         # Shared backend utilities
├── config/         # Configuration modules
└── database/       # Database entities and migrations
```

## 🔧 Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
2. **Make Changes**: Edit code in appropriate packages
3. **Run Tests**: `npm run test` (when implemented)
4. **Lint & Format**: `npm run lint && npm run format`
5. **Type Check**: `npm run type-check`
6. **Commit Changes**: Follow conventional commit format
7. **Create Pull Request**: Submit for review

## 🐳 Docker Development

For a complete Docker-based development environment:

```bash
# Start all services (frontend, backend, database)
npm run docker:dev

# View logs
docker-compose logs -f

# Stop all services
npm run docker:down
```

## 🔒 Environment Variables

### Backend Environment Variables

See `backend/env.example` for all available configuration options:

- Database connection settings
- JWT configuration
- File upload limits
- CORS settings
- Redis configuration

### Frontend Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_UPLOAD_URL` - File upload endpoint

## 🔧 Troubleshooting

### Kill Persistent Processes

If you encounter issues with processes running on port 3000 or need to stop persistent Next.js processes:

```bash
# Kill any process using port 3000 (recommended)
lsof -ti:3000 | xargs -r kill -9

# Alternative: Kill all Next.js related processes
pkill -f "next"
pkill -f "next-server"
pkill -f "node.*next"

# Nuclear option: Kill all node processes (use with caution)
pkill node
```

## 📚 Documentation

### Core Documentation
- **[📖 Complete Documentation Index](./docs/README.md)** - Start here for all guides
- **[🏗️ State Management Guide](./docs/fronted/state-management-guide.md)** - React Context, Zustand, TanStack Query patterns
- **[📋 Implementation Plan](./docs/development/IMPLEMENTATION_PLAN.md)** - Detailed development roadmap
- **[🎨 Frontend Implementation Guide](./docs/frontend/FRONTEND_IMPLEMENTATION_GUIDE.md)** - UX/UI strategy
- **[✅ Implementation Guidelines](./docs/development/IMPLEMENTATION_GUIDELINES.md)** - Development standards

### Quick Start for Developers
1. Read [Documentation Index](./docs/README.md) for overview
2. Review [State Management Guide](./docs/state-management-guide.md) for architecture patterns
3. Check [Implementation Plan](./docs/development/IMPLEMENTATION_PLAN.md) for current progress

### Additional Documentation
- [API Documentation](./docs/api.md) - API endpoints (when available)
- [Component Documentation](./docs/components.md) - UI components guide (when available)

## 🎯 Current Status

✅ Project structure setup
✅ Next.js frontend initialized with Tailwind CSS and shadcn/ui
✅ Nest.js backend initialized with TypeORM
✅ Shared types package created
✅ Docker Compose for local development
🔄 Currently implementing: Core backend modules

## 🤝 Contributing

1. Follow the established code style and conventions
2. Write TypeScript with strict type checking
3. Use conventional commit messages
4. Add tests for new features (when test setup is complete)
5. Update documentation as needed

## 📄 License

This project is private and proprietary.
