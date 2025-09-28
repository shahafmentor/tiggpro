# Tiggpro Google Cloud Platform Deployment Guide

This comprehensive guide covers deploying the Tiggpro family chore management application to Google Cloud Platform using Cloud Run, with automated CI/CD via GitHub Actions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GCP Project Setup](#gcp-project-setup)
3. [Service Account and IAM](#service-account-and-iam)
4. [Artifact Registry Setup](#artifact-registry-setup)
5. [Database Setup](#database-setup)
6. [Secrets Management](#secrets-management)
7. [GitHub Repository Configuration](#github-repository-configuration)
8. [Deployment Files](#deployment-files)
9. [Initial Deployment](#initial-deployment)
10. [Custom Domain Setup](#custom-domain-setup)
11. [Monitoring and Logging](#monitoring-and-logging)
12. [Security Considerations](#security-considerations)
13. [Cost Optimization](#cost-optimization)
14. [Troubleshooting](#troubleshooting)
15. [Maintenance and Updates](#maintenance-and-updates)

## Prerequisites

Before starting, ensure you have:

- [ ] Google Cloud Platform account with billing enabled
- [ ] GitHub repository with Tiggpro code
- [ ] Local development environment set up
- [ ] Domain name (optional, for custom domain)
- [ ] Google Cloud CLI installed and authenticated

### Required Tools

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Verify installation
gcloud --version

# Install Docker (for local testing)
# Follow instructions for your OS at https://docs.docker.com/get-docker/
```

## GCP Project Setup

### 1. Create GCP Project

```bash
# Set project variables
export PROJECT_ID="tiggpro-prod"  # Replace with your project ID
export REGION="us-central1"        # Choose your preferred region

# Create project
gcloud projects create $PROJECT_ID --name="Tiggpro Production"

# Set as default project
gcloud config set project $PROJECT_ID

# Link billing account (replace BILLING_ACCOUNT_ID)
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

### 2. Enable Required APIs

```bash
# Enable necessary APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sql.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  dns.googleapis.com \
  compute.googleapis.com \
  redis.googleapis.com
```

- [ ] Verify all APIs are enabled in the GCP Console

## Service Account and IAM

### 1. Create Service Account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for GitHub Actions CI/CD"

# Get service account email
export SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
```

### 2. Grant Required Permissions

```bash
# Core permissions for deployment
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

# Allow service account to act as Cloud Run runtime service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"
```

### 3. Create and Download Service Account Key

```bash
# Create key file
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=$SA_EMAIL

# Display key content (for GitHub secrets)
cat ~/github-actions-key.json
```

- [ ] Save the JSON key content securely for GitHub secrets configuration

## Artifact Registry Setup

### 1. Create Artifact Registry Repository

```bash
# Create repository for Docker images
gcloud artifacts repositories create tiggpro \
  --repository-format=docker \
  --location=$REGION \
  --description="Tiggpro application container images"
```

### 2. Configure Docker Authentication

```bash
# Configure Docker to authenticate with Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

- [ ] Verify repository creation in GCP Console

## Database Setup

### 1. Create Cloud SQL PostgreSQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create tiggpro-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-size=20GB \
  --storage-type=SSD \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --deletion-protection

# Create database
gcloud sql databases create tiggpro_prod \
  --instance=tiggpro-db

# Create database user
gcloud sql users create tiggpro_user \
  --instance=tiggpro-db \
  --password=SECURE_PASSWORD_HERE  # Replace with secure password
```

### 2. Create Redis Instance

```bash
# Create Redis instance for caching
gcloud redis instances create tiggpro-redis \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --network=default
```

### 3. Get Connection Details

```bash
# Get database connection details
gcloud sql instances describe tiggpro-db --format="value(connectionName)"

# Get Redis connection details
gcloud redis instances describe tiggpro-redis \
  --region=$REGION \
  --format="value(host,port)"
```

- [ ] Note connection details for secrets configuration

## Secrets Management

### 1. Create Required Secrets

```bash
# Database URL (format: postgresql://user:password@/database?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME)
export DB_CONNECTION_NAME=$(gcloud sql instances describe tiggpro-db --format="value(connectionName)")
export DATABASE_URL="postgresql://tiggpro_user:SECURE_PASSWORD_HERE@/tiggpro_prod?host=/cloudsql/${DB_CONNECTION_NAME}"

gcloud secrets create database-url --data-file=- <<< "$DATABASE_URL"

# Redis URL (format: redis://HOST:PORT)
export REDIS_HOST=$(gcloud redis instances describe tiggpro-redis --region=$REGION --format="value(host)")
export REDIS_PORT=$(gcloud redis instances describe tiggpro-redis --region=$REGION --format="value(port)")
export REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

gcloud secrets create redis-url --data-file=- <<< "$REDIS_URL"

# JWT secrets (generate secure random strings)
openssl rand -base64 32 | gcloud secrets create jwt-secret --data-file=-
openssl rand -base64 32 | gcloud secrets create jwt-refresh-secret --data-file=-
openssl rand -base64 32 | gcloud secrets create nextauth-secret --data-file=-
```

### 2. Grant Secret Access to Cloud Run

```bash
# Allow Cloud Run services to access secrets
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding redis-url \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-refresh-secret \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding nextauth-secret \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

- [ ] Verify all secrets are created in Secret Manager

## GitHub Repository Configuration

### 1. Add GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

- [ ] `GCP_PROJECT_ID`: Your GCP project ID
- [ ] `GCP_SA_KEY`: The entire JSON content of the service account key file

### 2. Verify GitHub Actions Workflow

The workflow file is already created at `.github/workflows/deploy.yml`. Verify it includes:

- [ ] Test and build stages
- [ ] Proper versioning using commit SHA
- [ ] Backend deployment with database connectivity
- [ ] Frontend deployment with backend URL injection
- [ ] Health checks
- [ ] Deployment summary

## Deployment Files

The following files have been created for deployment:

### Frontend Dockerfile (`frontend/Dockerfile`)
- [ ] Multi-stage build for optimization
- [ ] Non-root user for security
- [ ] Health checks
- [ ] Proper Next.js standalone build

### Backend Dockerfile (`backend/Dockerfile`)
- [ ] Multi-stage build for optimization
- [ ] Non-root user for security
- [ ] Health checks
- [ ] Production-ready Nest.js build

### CI/CD Workflow (`.github/workflows/deploy.yml`)
- [ ] Automated testing
- [ ] Docker image building and pushing
- [ ] Cloud Run deployment
- [ ] Service URL extraction and health checks

## Initial Deployment

### 1. Prepare Application

First, ensure your application has the necessary health check endpoints:

#### Frontend Health Check
Create `frontend/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'tiggpro-frontend'
  });
}
```

#### Backend Health Check
Verify `backend/src/health/health.controller.ts` exists and is properly configured.

### 2. Update Next.js Configuration

Update `frontend/next.config.ts` to support standalone builds:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    turbopack: false, // Disable for production builds
  },
  // Add other existing configuration
};

export default nextConfig;
```

### 3. Database Migration Setup

Create a migration script for initial deployment:

```bash
# In backend directory, create initial migration
cd backend
npm run migration:generate -- InitialSchema
```

### 4. Trigger First Deployment

```bash
# Commit and push all changes
git add .
git commit -m "feat: add GCP deployment configuration"
git push origin main
```

- [ ] Monitor GitHub Actions workflow execution
- [ ] Verify successful deployment in GCP Console
- [ ] Test application functionality

## Custom Domain Setup

### 1. Create DNS Zone (if needed)

```bash
# Create DNS zone for your domain
gcloud dns managed-zones create tiggpro-zone \
  --description="Tiggpro DNS zone" \
  --dns-name=yourdomain.com  # Replace with your domain
```

### 2. Map Custom Domain to Cloud Run

```bash
# Map domain to frontend service
gcloud run domain-mappings create \
  --service=tiggpro-frontend \
  --domain=yourdomain.com \
  --region=$REGION

# Map API subdomain to backend service
gcloud run domain-mappings create \
  --service=tiggpro-backend \
  --domain=api.yourdomain.com \
  --region=$REGION
```

### 3. Configure DNS Records

```bash
# Get the DNS records to configure
gcloud run domain-mappings describe \
  --domain=yourdomain.com \
  --region=$REGION
```

- [ ] Configure DNS records with your domain registrar
- [ ] Verify SSL certificate provisioning
- [ ] Test domain access

## Monitoring and Logging

### 1. Enable Cloud Monitoring

```bash
# Create uptime checks
gcloud alpha monitoring uptime create \
  --display-name="Tiggpro Frontend Uptime" \
  --hostname=yourdomain.com \
  --path="/api/health" \
  --timeout=10s \
  --period=60s

gcloud alpha monitoring uptime create \
  --display-name="Tiggpro Backend Uptime" \
  --hostname=api.yourdomain.com \
  --path="/health" \
  --timeout=10s \
  --period=60s
```

### 2. Set Up Alerting

Create alerting policies for:
- [ ] Service downtime
- [ ] High error rates
- [ ] Resource utilization
- [ ] Database connection issues

### 3. Configure Log Retention

```bash
# Set log retention for Cloud Run services
gcloud logging sinks create tiggpro-logs \
  storage.googleapis.com/tiggpro-logs-bucket \
  --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name=("tiggpro-frontend" OR "tiggpro-backend")'
```

## Security Considerations

### 1. VPC Configuration

For enhanced security, consider deploying to a VPC:

```bash
# Create VPC network
gcloud compute networks create tiggpro-vpc \
  --subnet-mode=custom

# Create subnet
gcloud compute networks subnets create tiggpro-subnet \
  --network=tiggpro-vpc \
  --range=10.0.0.0/24 \
  --region=$REGION
```

### 2. Cloud Armor (DDoS Protection)

```bash
# Create security policy
gcloud compute security-policies create tiggpro-security-policy \
  --description="Security policy for Tiggpro"

# Add rate limiting rule
gcloud compute security-policies rules create 1000 \
  --security-policy=tiggpro-security-policy \
  --expression="true" \
  --action=rate-based-ban \
  --rate-limit-threshold-count=100 \
  --rate-limit-threshold-interval-sec=60 \
  --ban-duration-sec=600
```

### 3. IAM Best Practices

- [ ] Use principle of least privilege
- [ ] Regularly rotate service account keys
- [ ] Enable audit logging
- [ ] Use organization policies for compliance

## Cost Optimization

### 1. Cloud Run Configuration

Optimize Cloud Run settings for cost:

```yaml
# In your deployment workflow
--min-instances 0          # Scale to zero when not in use
--max-instances 10         # Prevent runaway scaling
--concurrency 100          # Higher concurrency for frontend
--concurrency 80           # Lower concurrency for backend
--cpu 1                    # Start with 1 vCPU
--memory 512Mi             # Minimal memory for frontend
--memory 1Gi               # More memory for backend
```

### 2. Database Optimization

```bash
# Use smaller instance for development
gcloud sql instances patch tiggpro-db \
  --tier=db-f1-micro  # Smallest instance

# Enable automatic storage increases
gcloud sql instances patch tiggpro-db \
  --storage-auto-increase
```

### 3. Set Budget Alerts

```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Tiggpro Monthly Budget" \
  --budget-amount=50USD \
  --threshold-percent=50,90,100
```

### 4. Cost Monitoring Recommendations

- [ ] Monitor Cloud Run cold starts
- [ ] Optimize Docker image sizes
- [ ] Use Cloud Run CPU allocation efficiently
- [ ] Monitor database connection pooling
- [ ] Review Cloud Storage usage for logs

## Service Communication Configuration

### Environment Variables for Different Environments

The application uses different API URLs depending on the environment:

#### Local Development
```bash
# In frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001  # Browser-side calls
```

#### Docker Development
```bash
# In docker-compose.yml
NEXT_PUBLIC_API_URL=http://localhost:3001  # Browser-side calls
INTERNAL_API_URL=http://backend:3001       # Server-side calls (NextAuth callbacks)
```

#### GCP Cloud Run Production
```bash
# Set automatically by deployment workflow
NEXT_PUBLIC_API_URL=https://tiggpro-backend-xxxxx.run.app    # Browser-side calls
INTERNAL_API_URL=https://tiggpro-backend-xxxxx.run.app       # Server-side calls
```

### Why Two URLs Are Needed

- **`NEXT_PUBLIC_API_URL`**: Used by browser (client-side) - exposed to the client
- **`INTERNAL_API_URL`**: Used by server-side code (NextAuth callbacks) - internal only

### Code Implementation

In `frontend/src/lib/auth.ts`:
```typescript
const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;
const response = await fetch(`${apiUrl}/auth/sync-user`, {
  // NextAuth signIn callback runs server-side
});
```

This ensures:
- **Local development**: Both use `localhost:3001`
- **Docker**: Server-side uses Docker network (`backend:3001`), client-side uses host network (`localhost:3001`)
- **Cloud Run**: Both use the same Cloud Run service URL

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Build Failures

```bash
# Test Docker builds locally
docker build -f frontend/Dockerfile -t tiggpro-frontend .
docker build -f backend/Dockerfile -t tiggpro-backend .

# Check build logs
gcloud builds log BUILD_ID
```

#### 2. Database Connection Issues

```bash
# Test database connectivity
gcloud sql connect tiggpro-db --user=tiggpro_user

# Check Cloud SQL proxy setup
gcloud sql instances describe tiggpro-db
```

#### 3. Service Deployment Failures

```bash
# Check service logs
gcloud run services logs read tiggpro-backend --region=$REGION
gcloud run services logs read tiggpro-frontend --region=$REGION

# Describe service configuration
gcloud run services describe tiggpro-backend --region=$REGION
```

#### 4. Secret Access Issues

```bash
# Verify secret exists
gcloud secrets versions list database-url

# Check IAM permissions
gcloud secrets get-iam-policy database-url
```

### Debugging Checklist

- [ ] Verify all required APIs are enabled
- [ ] Check service account permissions
- [ ] Validate secret manager configuration
- [ ] Confirm database connectivity
- [ ] Review Docker image build logs
- [ ] Check Cloud Run service logs
- [ ] Verify environment variables
- [ ] Test health check endpoints

## Maintenance and Updates

### 1. Regular Maintenance Tasks

#### Weekly
- [ ] Review error logs and metrics
- [ ] Check security vulnerabilities
- [ ] Monitor resource usage and costs

#### Monthly
- [ ] Update dependencies
- [ ] Review and rotate secrets
- [ ] Database maintenance and optimization
- [ ] Review access logs and security

### 2. Update Process

For application updates:

1. [ ] Create feature branch
2. [ ] Test changes locally
3. [ ] Deploy to staging environment (if configured)
4. [ ] Merge to main branch
5. [ ] Monitor deployment in production
6. [ ] Verify application functionality

### 3. Backup Strategy

```bash
# Database backups (automatic with Cloud SQL)
gcloud sql backups list --instance=tiggpro-db

# Export database for major updates
gcloud sql export sql tiggpro-db gs://tiggpro-backups/backup-$(date +%Y%m%d).sql \
  --database=tiggpro_prod
```

### 4. Disaster Recovery

- [ ] Document recovery procedures
- [ ] Test backup restoration
- [ ] Maintain infrastructure as code
- [ ] Document configuration dependencies

## Performance Optimization

### 1. Frontend Optimization

- [ ] Enable Next.js image optimization
- [ ] Configure proper caching headers
- [ ] Use CDN for static assets
- [ ] Implement service worker for offline functionality

### 2. Backend Optimization

- [ ] Implement database connection pooling
- [ ] Add Redis caching for frequent queries
- [ ] Optimize database indexes
- [ ] Monitor and optimize N+1 queries

### 3. Infrastructure Optimization

- [ ] Monitor Cold start times
- [ ] Adjust CPU and memory allocation
- [ ] Optimize container image sizes
- [ ] Configure auto-scaling parameters

## Compliance and Security

### 1. Data Protection

- [ ] Implement data encryption at rest
- [ ] Configure SSL/TLS for all communications
- [ ] Set up data retention policies
- [ ] Implement audit logging

### 2. Access Control

- [ ] Use IAM roles and policies
- [ ] Implement service account rotation
- [ ] Configure VPC security
- [ ] Set up network security policies

## Conclusion

This deployment guide provides a comprehensive foundation for deploying Tiggpro to Google Cloud Platform. The configuration balances security, performance, and cost-effectiveness while providing a scalable foundation for the family chore management application.

### Next Steps

After successful deployment:

1. [ ] Set up monitoring dashboards
2. [ ] Configure automated backups
3. [ ] Implement staging environment
4. [ ] Set up performance monitoring
5. [ ] Create operational runbooks
6. [ ] Train team on troubleshooting procedures

### Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
- [Nest.js Production Guide](https://docs.nestjs.com/recipes/crud-utilities)

For support and questions, refer to the project documentation and team resources.