# Frontend Dockerfile for Tiggpro Next.js Application
# Multi-stage build for optimized production image

# Stage 1: Base image with Node.js
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies needed for node-gyp
RUN apk add --no-cache libc6-compat

# Stage 2: Dependencies installation
FROM base AS deps
# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install all dependencies (including dev dependencies needed for build)
RUN npm ci --legacy-peer-deps

# Stage 3: Build shared package
FROM base AS shared-builder
COPY shared/ ./shared/
COPY package*.json ./
RUN cd shared && npm install && npm run build

# Stage 4: Build application
FROM base AS builder
WORKDIR /app

# Accept build arguments for Next.js public environment variables
# These must be provided at build time to be baked into the bundle
ARG NEXT_PUBLIC_API_URL

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Copy shared package build
COPY --from=shared-builder /app/shared/dist ./shared/dist
COPY --from=shared-builder /app/shared/package.json ./shared/package.json

# Copy source code
COPY frontend/ ./frontend/
COPY package*.json ./

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Pass build args as environment variables so Next.js can use them during build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the application
WORKDIR /app/frontend
RUN npm run build

# Stage 5: Development image
FROM base AS development
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY shared/package*.json ./shared/

# Install all dependencies (including dev dependencies)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY frontend/ ./frontend/
COPY shared/ ./shared/

# Build shared package in development
WORKDIR /app/shared
RUN npm run build

# Set working directory to frontend
WORKDIR /app/frontend

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Start in development mode with hot reloading
CMD ["npm", "run", "dev"]

# Stage 6: Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output which includes node_modules and minimal dependencies
COPY --from=builder /app/frontend/.next/standalone ./

# Copy static files
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

# Copy public files
COPY --from=builder /app/frontend/public ./frontend/public

# Set proper permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application from the frontend directory where server.js is located
CMD ["node", "frontend/server.js"]