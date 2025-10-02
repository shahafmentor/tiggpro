# Backend Dockerfile for Tiggpro Nest.js Application
# Multi-stage build for optimized production image

# Stage 1: Base image with Node.js
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies needed for node-gyp and native packages
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# Stage 2: Dependencies installation
FROM base AS deps
# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install all dependencies (including dev dependencies for build)
RUN npm ci --legacy-peer-deps

# Stage 3: Build shared package
FROM base AS shared-builder
COPY shared/ ./shared/
COPY package*.json ./
RUN cd shared && npm install && npm run build

# Stage 4: Build application
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy shared package build
COPY --from=shared-builder /app/shared/dist ./shared/dist
COPY --from=shared-builder /app/shared/package.json ./shared/package.json

# Copy source code
COPY backend/ ./backend/
COPY package*.json ./

# Build the application
WORKDIR /app/backend
RUN npm run build

# Install production dependencies in a separate location
FROM base AS prod-deps
WORKDIR /app/backend

# Copy backend package files only (no workspace context)
COPY backend/package*.json ./

# Install backend production dependencies standalone (use install since no lockfile)
RUN npm install --only=production --legacy-peer-deps --prefer-offline

# Stage 5: Development image
FROM base AS development
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install all dependencies (including dev dependencies)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY backend/ ./backend/
COPY shared/ ./shared/

# Build shared package in development
WORKDIR /app/shared
RUN npm run build

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3001

# Start in development mode with hot reloading
CMD ["npm", "run", "start:dev"]

# Stage 6: Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application and production dependencies
COPY --from=builder /app/backend/dist ./dist
COPY --from=prod-deps /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/package.json

# Set proper permissions
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/src/main.js"]