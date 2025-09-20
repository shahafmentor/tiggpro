# State Management Architecture Guide

*A comprehensive guide to state management in the Tiggpro frontend application*

## Overview

This application uses multiple state management solutions, each serving a specific purpose. This guide explains when and how to use each approach to maintain clean, maintainable code.

## Architecture Diagram

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   React Context    │    │      Zustand       │    │   TanStack Query   │
│  (Business Logic)  │    │   (UI Preferences)  │    │  (Server State)    │
├─────────────────────┤    ├─────────────────────┤    ├─────────────────────┤
│ • Tenant Selection  │    │ • Theme Settings    │    │ • API Responses     │
│ • User Permissions  │    │ • Sidebar State     │    │ • Loading States    │
│ • App Configuration │    │ • UI Preferences    │    │ • Error Handling    │
│ • Auto-selection    │    │ • Optimistic UI     │    │ • Cache Management  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                                ┌─────────────────────┐
                                │   Local useState    │
                                │ (Component State)   │
                                ├─────────────────────┤
                                │ • Form Inputs       │
                                │ • Modal Visibility  │
                                │ • Local UI State    │
                                │ • Temporary Data    │
                                └─────────────────────┘
```

## State Management Solutions

### 1. React Context - Business Logic State

**Purpose**: Critical business state that affects data fetching and user permissions

**Location**: `/lib/contexts/`

**Current Implementation**:
- `TenantContext` - Manages current tenant/family selection

```tsx
// Usage Example
const { currentTenant, setCurrentTenant } = useTenant()

// Features
- Auto-selection of single tenant
- localStorage persistence
- Initialization logic
- Provider pattern for deep component tree access
```

**When to Use**:
- ✅ Business-critical state (tenant, user role)
- ✅ State needed by many components across the app
- ✅ Complex initialization or side effects
- ✅ State that affects data fetching patterns

**When NOT to Use**:
- ❌ Simple UI state (prefer useState)
- ❌ Server data (use TanStack Query)
- ❌ User preferences (use Zustand)

### 2. Zustand - UI State & Preferences

**Purpose**: Global UI state and user preferences

**Location**: `/lib/stores/app-store.ts`

**Current Implementation**:
```tsx
interface AppState {
  // Theme preferences
  theme: 'light' | 'dark'
  userTheme: 'parent' | 'kid'

  // UI state
  sidebarOpen: boolean
  bottomSheetOpen: boolean
  isLoading: boolean
  error: string | null

  // Optimistic UI
  completingChores: Set<string>
}
```

**Usage**:
```tsx
// Get specific state
const theme = useAppStore(state => state.theme)

// Get multiple values with selector
const { theme, sidebarOpen } = useAppStore(state => ({
  theme: state.theme,
  sidebarOpen: state.sidebarOpen
}))

// Update state
const { setTheme, setSidebarOpen } = useAppStore()
```

**When to Use**:
- ✅ UI preferences and settings
- ✅ Global app state (loading, errors)
- ✅ State that needs persistence
- ✅ Optimistic UI updates
- ✅ Simple state with minimal logic

**When NOT to Use**:
- ❌ Server data (use TanStack Query)
- ❌ Complex business logic (use Context)
- ❌ Component-specific state (use useState)

### 3. TanStack Query - Server State

**Purpose**: All server data management, caching, and synchronization

**Location**: API calls throughout the app

**Current Implementation**:
```tsx
// Fetching data
const { data: assignments, isLoading, error } = useQuery({
  queryKey: ['user-assignments', tenantId],
  queryFn: () => assignmentsApi.getUserAssignments(tenantId),
  enabled: !!tenantId,
  staleTime: 30000
})

// Mutations
const submitMutation = useMutation({
  mutationFn: (data) => assignmentsApi.submitAssignment(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['user-assignments'])
  }
})
```

**When to Use**:
- ✅ ALL server data (assignments, chores, users)
- ✅ Loading and error states for API calls
- ✅ Data caching and background refetching
- ✅ Optimistic updates with rollback
- ✅ Pagination and infinite queries

**When NOT to Use**:
- ❌ Local UI state
- ❌ User preferences
- ❌ Business logic state

### 4. useState - Component State

**Purpose**: Component-specific state and local UI interactions

**Usage**: Throughout components for local state

**Examples**:
```tsx
// Form state
const [submissionNotes, setSubmissionNotes] = useState('')

// Modal visibility
const [editingChore, setEditingChore] = useState<Chore | null>(null)

// Local UI state
const [searchTerm, setSearchTerm] = useState('')
const [filterStatus, setFilterStatus] = useState('all')
```

**When to Use**:
- ✅ Form inputs and validation
- ✅ Modal/dialog visibility
- ✅ Component-specific UI state
- ✅ Temporary data that doesn't need persistence

**When NOT to Use**:
- ❌ State needed by multiple components
- ❌ State that needs persistence
- ❌ Server data

## Decision Tree

```
Need to manage state?
│
├─ Is it server data?
│  └─ YES → Use TanStack Query
│
├─ Is it needed by multiple components?
│  ├─ YES → Is it business logic?
│  │  ├─ YES → Use React Context
│  │  └─ NO → Use Zustand
│  │
│  └─ NO → Use useState
```

## Best Practices

### ✅ DO

1. **Single Source of Truth**
   ```tsx
   // Good: One source for tenant data
   const { currentTenant } = useTenant()
   ```

2. **Clear Separation of Concerns**
   ```tsx
   const MyComponent = () => {
     // Business state
     const { currentTenant } = useTenant()

     // UI state
     const { theme } = useAppStore()

     // Server state
     const { data: chores } = useQuery(['chores', currentTenant?.tenant.id])

     // Local state
     const [selectedChore, setSelectedChore] = useState(null)
   }
   ```

3. **Use Appropriate Selectors**
   ```tsx
   // Good: Select only what you need
   const theme = useAppStore(state => state.theme)

   // Avoid: Selecting entire store
   const store = useAppStore() // ❌
   ```

4. **Proper Query Keys**
   ```tsx
   // Good: Include dependencies
   queryKey: ['assignments', tenantId, userId]

   // Bad: Static keys
   queryKey: ['assignments'] // ❌
   ```

### ❌ DON'T

1. **Don't Duplicate State**
   ```tsx
   // Bad: Same data in multiple places
   const tenantFromContext = useTenant()
   const tenantFromStore = useAppStore(state => state.tenant) // ❌
   ```

2. **Don't Use Wrong Tool**
   ```tsx
   // Bad: Server data in local state
   const [users, setUsers] = useState([]) // ❌
   // Good: Use TanStack Query
   const { data: users } = useQuery(['users'], fetchUsers)
   ```

3. **Don't Over-Engineer**
   ```tsx
   // Bad: Global state for local data
   const setModalOpen = useAppStore(state => state.setModalOpen) // ❌
   // Good: Local state
   const [modalOpen, setModalOpen] = useState(false)
   ```

## Common Patterns

### Pattern 1: Dependent Queries
```tsx
const { currentTenant } = useTenant()
const { data: assignments } = useQuery({
  queryKey: ['assignments', currentTenant?.tenant.id],
  queryFn: () => assignmentsApi.getUserAssignments(currentTenant.tenant.id),
  enabled: !!currentTenant?.tenant.id
})
```

### Pattern 2: Optimistic Updates
```tsx
const { addCompletingChore, removeCompletingChore } = useAppStore()

const completeMutation = useMutation({
  mutationFn: completeChore,
  onMutate: (choreId) => {
    addCompletingChore(choreId) // Optimistic UI
  },
  onSettled: (choreId) => {
    removeCompletingChore(choreId) // Clean up
  }
})
```

### Pattern 3: Conditional Rendering Based on State
```tsx
const { currentTenant } = useTenant()
const { theme } = useAppStore()
const { data: assignments, isLoading } = useQuery(...)

if (!currentTenant) return <TenantSelector />
if (isLoading) return <LoadingSkeleton />
return <AssignmentsList assignments={assignments} theme={theme} />
```

## Migration Guide

### When Adding New State

1. **Identify the type of state**
   - Server data → TanStack Query
   - Business logic → React Context
   - UI preferences → Zustand
   - Component-specific → useState

2. **Check for existing patterns**
   - Look at similar state in the codebase
   - Follow established naming conventions
   - Use existing selectors when possible

3. **Consider the lifecycle**
   - Does it need persistence?
   - Does it need to survive navigation?
   - Does it need to be shared?

### Refactoring Existing State

1. **Identify overlaps**
   - Look for duplicate state
   - Check for wrong tool usage
   - Consolidate similar patterns

2. **Plan the migration**
   - Update consumers gradually
   - Maintain backward compatibility temporarily
   - Test thoroughly

3. **Clean up**
   - Remove old state management
   - Update documentation
   - Remove unused imports

## Testing Considerations

### Testing Context
```tsx
// Wrap components with provider
const renderWithTenant = (ui, { tenant } = {}) => {
  return render(
    <TenantProvider value={{ currentTenant: tenant }}>
      {ui}
    </TenantProvider>
  )
}
```

### Testing Zustand
```tsx
// Reset store between tests
beforeEach(() => {
  useAppStore.setState({
    theme: 'light',
    sidebarOpen: false,
    // ... reset to defaults
  })
})
```

### Testing TanStack Query
```tsx
// Use QueryClient for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

## Debugging Tips

### 1. React DevTools
- Install React DevTools browser extension
- View Context values in Components tab
- Track state changes in real-time

### 2. TanStack Query DevTools
```tsx
// Add to app in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </>
  )
}
```

### 3. Zustand DevTools
```tsx
// Enable Redux DevTools for Zustand
export const useAppStore = create<AppState>()(
  devtools(
    persist(/* ... */),
    { name: 'app-store' }
  )
)
```

### 4. Console Debugging
```tsx
// Add temporary logging
const { currentTenant } = useTenant()
console.log('Current tenant:', currentTenant) // Remove in production
```

## Performance Considerations

### Context Performance
- Use multiple contexts to avoid unnecessary re-renders
- Memoize context values
- Split frequently changing state from stable state

### Zustand Performance
- Use selectors to subscribe to specific state
- Avoid selecting large objects unnecessarily
- Use shallow comparison for object selections

### Query Performance
- Set appropriate `staleTime` and `cacheTime`
- Use `enabled` option for conditional queries
- Implement proper error boundaries

## Conclusion

This multi-layered state management approach provides:

- **Clarity**: Each tool has a specific purpose
- **Maintainability**: Easy to understand and modify
- **Performance**: Optimized for different use cases
- **Scalability**: Can grow with the application

When in doubt, refer to the decision tree and follow the established patterns in the codebase.

---

**Last Updated**: September 2025
**Version**: 1.0
**Maintainer**: Development Team