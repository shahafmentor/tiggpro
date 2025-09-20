# Centralized API Configuration

This directory contains the centralized API configuration and client modules for the Tiggpro frontend.

## 🔧 Configuration

### API Base URL

The API base URL is centrally configured in `config.ts` and automatically determined based on:

1. **Production**: Uses `NEXT_PUBLIC_API_URL` environment variable or defaults to production URL
2. **Development**: Uses `NEXT_PUBLIC_API_URL` environment variable or defaults to `http://localhost:3001`

### Changing API URL

To change the API URL for different environments:

#### Development (Local)
Create a `.env.local` file in the frontend root:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3005
```

#### Production
Set the environment variable in your deployment:
```bash
NEXT_PUBLIC_API_URL=https://api.tiggpro.com
```

## 📁 Structure

```
frontend/src/lib/api/
├── index.ts           # Main export file - import everything from here
├── config.ts          # Centralized configuration
├── base.ts           # Base API client with authentication
├── chores.ts         # Chore-related API calls
├── assignments.ts    # Assignment-related API calls
├── tenants.ts        # Tenant management API calls
├── gamification.ts   # Gamification API calls
└── README.md         # This file
```

## 🚀 Usage

### Import API modules

```typescript
// Recommended: Import from index
import { choresApi, API_CONFIG } from '@/lib/api'

// Or import individual modules
import { choresApi } from '@/lib/api/chores'
```

### Use centralized configuration

```typescript
import { API_CONFIG, buildApiUrl } from '@/lib/api'

console.log('Current API base URL:', API_CONFIG.BASE_URL)
const url = buildApiUrl('/health') // http://localhost:3001/health
```

### Make API calls

```typescript
import { choresApi } from '@/lib/api'

// All API calls automatically use:
// - Centralized base URL
// - Authentication headers
// - Error handling
// - Request timeout
const chores = await choresApi.getChoresByTenant(tenantId)
```

## ✨ Benefits

1. **Single Source of Truth**: Change API URL in one place (`config.ts`)
2. **Environment Aware**: Automatically adapts to development/production
3. **Consistent Error Handling**: All API calls use the same error handling
4. **Authentication**: Automatic JWT token inclusion
5. **Type Safety**: Full TypeScript support for all API responses
6. **Development Logging**: Automatic API call logging in development mode

## 🔍 Debugging

In development mode, all API calls are automatically logged to the console:

```
🔧 API Configuration: { baseUrl: "http://localhost:3001", environment: "development" }
📡 API GET /tenants/123/chores: { status: 200, success: true }
❌ API Error POST /tenants/123/chores: Request timeout
```

## 🔄 Migration

If you need to update an API call, you only need to change it in one place:

```typescript
// Before (scattered across files)
fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${id}/chores`)

// After (centralized)
choresApi.getChoresByTenant(id)
```

## 🛠️ Adding New API Endpoints

1. Add the function to the appropriate API module (e.g., `chores.ts`)
2. Use the centralized `api` utility from `base.ts`
3. Export the function in `index.ts`
4. Add TypeScript types as needed

Example:
```typescript
// In chores.ts
export const choresApi = {
  // ... existing methods

  async getChoreHistory(tenantId: string, choreId: string): Promise<ApiResponse<ChoreHistory[]>> {
    return api.get(`/tenants/${tenantId}/chores/${choreId}/history`)
  },
}

// In index.ts
export { choresApi } from './chores'
```

