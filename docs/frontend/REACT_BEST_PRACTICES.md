# React Best Practices & Development Standards
*Tiggpro Frontend Development Guidelines*

## 📋 Table of Contents
1. [Component Architecture](#component-architecture)
2. [TypeScript & Props Interfaces](#typescript--props-interfaces)
3. [State Management Strategy](#state-management-strategy)
4. [Request Cache Management](#request-cache-management)
5. [Performance Optimization](#performance-optimization)
6. [Component Composition Patterns](#component-composition-patterns)
7. [Error Handling & Loading States](#error-handling--loading-states)
8. [Naming Conventions](#naming-conventions)
9. [File Organization](#file-organization)
10. [Testing Guidelines](#testing-guidelines)

---

## 🏗️ Component Architecture

### Component Types & Responsibilities

#### **1. Server Components (Default)**
```typescript
// Use for data fetching and static content
// app/dashboard/page.tsx
import { ChoreList } from '@/components/chores/chore-list'
import { getChoresByTenant } from '@/lib/api'

export default async function DashboardPage({
  params
}: {
  params: { locale: string }
}) {
  // Data fetching happens on server
  const chores = await getChoresByTenant()

  return (
    <div>
      <h1>Dashboard</h1>
      <ChoreList chores={chores} />
    </div>
  )
}
```

#### **2. Client Components (Selective)**
```typescript
// Use ONLY when you need:
// - Event handlers
// - Browser APIs
// - State management
// - Effects

'use client'
import { useState, useOptimistic } from 'react'

interface ChoreCardProps {
  chore: Chore
  onComplete: (choreId: string) => Promise<void>
}

export function ChoreCard({ chore, onComplete }: ChoreCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await onComplete(chore.id)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Card>
      {/* Component JSX */}
    </Card>
  )
}
```

#### **3. Hybrid Pattern (Recommended)**
```typescript
// Server Component (data fetching)
async function ChoreListServer({ tenantId }: { tenantId: string }) {
  const chores = await getChores(tenantId)
  return <ChoreListClient chores={chores} />
}

// Client Component (interactions)
'use client'
function ChoreListClient({ chores }: { chores: Chore[] }) {
  const [filteredChores, setFilteredChores] = useState(chores)

  return (
    <div>
      <ChoreFilter onFilter={setFilteredChores} />
      {filteredChores.map(chore => (
        <ChoreCard key={chore.id} chore={chore} />
      ))}
    </div>
  )
}
```

### Component Size Guidelines
- **Single Responsibility**: Each component should have one clear purpose
- **Max 150 lines**: If larger, split into smaller components
- **Composable**: Components should be reusable and composable
- **Testable**: Easy to unit test in isolation

---

## 🔷 TypeScript & Props Interfaces

### Interface Naming & Organization

#### **1. Props Interfaces**
```typescript
// ✅ Good: Clear, descriptive naming
interface ChoreCardProps {
  chore: Chore
  variant?: 'compact' | 'detailed'
  showAssignee?: boolean
  onComplete?: (choreId: string) => Promise<void>
  onEdit?: (chore: Chore) => void
  className?: string
}

// ✅ Good: Optional props with defaults
interface PointsDisplayProps {
  currentPoints: number
  level: number
  nextLevelThreshold: number
  animated?: boolean // Optional with default false
  size?: 'sm' | 'md' | 'lg' // Optional with default 'md'
}

// ❌ Avoid: Generic or unclear names
interface Props {
  data: any
  callback: Function
}
```

#### **2. Event Handler Types**
```typescript
// ✅ Good: Specific event handler types
interface ChoreFormProps {
  initialValues?: Partial<CreateChoreRequest>
  onSubmit: (values: CreateChoreRequest) => Promise<void>
  onCancel: () => void
  onFieldChange?: (field: keyof CreateChoreRequest, value: any) => void
}

// ✅ Good: Mouse and keyboard events
interface InteractiveCardProps {
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void
}
```

#### **3. Children & Render Props**
```typescript
// ✅ Good: Flexible children patterns
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

// ✅ Good: Render props for complex composition
interface DataTableProps<T> {
  data: T[]
  loading?: boolean
  renderRow: (item: T, index: number) => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderLoading?: () => React.ReactNode
}
```

#### **4. Generic Components**
```typescript
// ✅ Good: Generic components for reusability
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string | number
  loading?: boolean
  error?: string | null
}

function List<T>({ items, renderItem, keyExtractor, loading, error }: ListProps<T>) {
  if (loading) return <ListSkeleton />
  if (error) return <ErrorMessage message={error} />

  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  )
}
```

### Type Safety Best Practices
- **Strict TypeScript**: Always use strict mode
- **No `any`**: Use specific types or `unknown`
- **Discriminated Unions**: For component variants
- **Branded Types**: For IDs and specific values

```typescript
// ✅ Good: Discriminated unions for variants
type ButtonVariant =
  | { variant: 'primary'; priority: 'high' | 'medium' }
  | { variant: 'secondary'; outline?: boolean }
  | { variant: 'ghost'; size: 'sm' | 'md' }

// ✅ Good: Branded types for safety
type UserId = string & { __brand: 'UserId' }
type TenantId = string & { __brand: 'TenantId' }
type ChoreId = string & { __brand: 'ChoreId' }
```

---

## 🗄️ State Management Strategy

### State Location Decision Matrix

| State Type | Location | Tool | Example |
|------------|----------|------|---------|
| **Server State** | TanStack Query | `useQuery`, `useMutation` | Chores, Users, Assignments |
| **Global Client State** | Zustand Store | `useAppStore` | Current tenant, theme, user preferences |
| **Page-Level State** | Component State | `useState` | Form inputs, modals, filters |
| **Component State** | Local State | `useState` | Loading states, UI interactions |

### **1. Server State Management (TanStack Query)**
```typescript
// lib/queries/chores.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ✅ Good: Centralized query keys
export const choreKeys = {
  all: ['chores'] as const,
  byTenant: (tenantId: string) => [...choreKeys.all, 'tenant', tenantId] as const,
  detail: (choreId: string) => [...choreKeys.all, 'detail', choreId] as const,
}

// ✅ Good: Custom hooks for server state
export function useChores(tenantId: string) {
  return useQuery({
    queryKey: choreKeys.byTenant(tenantId),
    queryFn: () => getChoresByTenant(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCompleteChore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeChore,
    onSuccess: (data, variables) => {
      // Optimistic update
      queryClient.setQueryData(
        choreKeys.detail(variables.choreId),
        (old: Chore | undefined) =>
          old ? { ...old, status: 'completed' } : old
      )

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: choreKeys.byTenant(variables.tenantId)
      })
    },
  })
}
```

### **2. Global Client State (Zustand)**
```typescript
// lib/stores/app-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // Current tenant/family
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void

  // UI state
  theme: 'light' | 'dark'
  userTheme: 'parent' | 'kid'
  setTheme: (theme: 'light' | 'dark') => void
  setUserTheme: (userTheme: 'parent' | 'kid') => void

  // Optimistic UI state
  completingChores: Set<string>
  addCompletingChore: (choreId: string) => void
  removeCompletingChore: (choreId: string) => void

  // Navigation state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Current tenant
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),

      // Theme
      theme: 'light',
      userTheme: 'parent',
      setTheme: (theme) => set({ theme }),
      setUserTheme: (userTheme) => set({ userTheme }),

      // Optimistic state
      completingChores: new Set(),
      addCompletingChore: (choreId) => set(state => ({
        completingChores: new Set([...state.completingChores, choreId])
      })),
      removeCompletingChore: (choreId) => set(state => {
        const newSet = new Set(state.completingChores)
        newSet.delete(choreId)
        return { completingChores: newSet }
      }),

      // Navigation
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'tiggpro-app-storage',
      partialize: (state) => ({
        currentTenant: state.currentTenant,
        theme: state.theme,
        userTheme: state.userTheme,
      }),
    }
  )
)
```

### **3. Component State Guidelines**
```typescript
// ✅ Good: Local state for UI interactions
function ChoreCard({ chore }: ChoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Local state that doesn't need to be shared
  return (
    <Card>
      <CardHeader onClick={() => setIsExpanded(!isExpanded)}>
        {chore.title}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <Button onClick={() => setShowDetails(true)}>
            View Details
          </Button>
        </CardContent>
      )}
      {showDetails && (
        <ChoreDetailsModal
          chore={chore}
          onClose={() => setShowDetails(false)}
        />
      )}
    </Card>
  )
}

// ✅ Good: Form state management
function ChoreForm({ onSubmit }: ChoreFormProps) {
  const [formData, setFormData] = useState<CreateChoreRequest>({
    title: '',
    description: '',
    points: 10,
    difficulty: 'medium'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateChoreForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

---

## 🚀 Request Cache Management

### **1. TanStack Query Configuration**
```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data is considered fresh for this duration
      staleTime: 5 * 60 * 1000, // 5 minutes

      // GC time - data is kept in cache for this duration
      gcTime: 10 * 60 * 1000, // 10 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 3
      },

      // Refetch on window focus for critical data
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations on network errors
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('network')) {
          return failureCount < 2
        }
        return false
      },
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### **2. Cache Invalidation Strategies**
```typescript
// lib/queries/mutations.ts
export function useCreateChore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createChore,
    onSuccess: (newChore, variables) => {
      // 1. Add to existing list cache
      queryClient.setQueryData(
        choreKeys.byTenant(variables.tenantId),
        (old: Chore[] | undefined) =>
          old ? [newChore, ...old] : [newChore]
      )

      // 2. Update related caches
      queryClient.invalidateQueries({
        queryKey: ['dashboard-stats', variables.tenantId]
      })

      // 3. Preload the new chore details
      queryClient.setQueryData(
        choreKeys.detail(newChore.id),
        newChore
      )
    },
    onError: (error, variables) => {
      // Show error toast
      toast.error(`Failed to create chore: ${error.message}`)
    },
  })
}
```

### **3. Optimistic Updates**
```typescript
// components/chore-card.tsx
function ChoreCard({ chore }: ChoreCardProps) {
  const queryClient = useQueryClient()
  const { mutate: completeChore } = useCompleteChore()

  const handleComplete = () => {
    // Optimistic update
    queryClient.setQueryData(
      choreKeys.detail(chore.id),
      (old: Chore | undefined) =>
        old ? { ...old, status: 'completed' as const } : old
    )

    // Actual mutation
    completeChore(
      { choreId: chore.id, tenantId: chore.tenantId },
      {
        onError: (error) => {
          // Revert optimistic update on error
          queryClient.setQueryData(
            choreKeys.detail(chore.id),
            (old: Chore | undefined) =>
              old ? { ...old, status: chore.status } : old
          )

          toast.error('Failed to complete chore')
        },
      }
    )
  }

  return (
    <Card>
      <Button onClick={handleComplete}>
        Complete Chore
      </Button>
    </Card>
  )
}
```

### **4. Background Sync & Offline Support**
```typescript
// lib/queries/offline.ts
export function useOfflineSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleOnline = () => {
      // Refetch all queries when coming back online
      queryClient.refetchQueries({
        type: 'active',
      })
    }

    const handleOffline = () => {
      // Store pending mutations for retry when online
      const mutations = queryClient.getMutationCache().getAll()
      localStorage.setItem('pending-mutations', JSON.stringify(
        mutations.filter(m => m.state.status === 'error')
      ))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])
}
```

---

## ⚡ Performance Optimization

### **1. Memoization Guidelines**

#### **React.memo Usage**
```typescript
// ✅ Good: Memo for expensive renders or frequently re-rendered components
const ChoreCard = React.memo(function ChoreCard({
  chore,
  onComplete
}: ChoreCardProps) {
  // Complex rendering logic
  return <Card>{/* ... */}</Card>
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.chore.id === nextProps.chore.id &&
    prevProps.chore.status === nextProps.chore.status &&
    prevProps.chore.updatedAt === nextProps.chore.updatedAt
  )
})

// ❌ Avoid: Memo on simple components
const SimpleButton = React.memo(({ children, onClick }: ButtonProps) => (
  <button onClick={onClick}>{children}</button>
)) // Not needed for simple components
```

#### **useMemo for Expensive Calculations**
```typescript
function ChoreStatistics({ chores }: { chores: Chore[] }) {
  // ✅ Good: Memoize expensive calculations
  const statistics = useMemo(() => {
    const completed = chores.filter(c => c.status === 'completed').length
    const pending = chores.filter(c => c.status === 'pending').length
    const overdue = chores.filter(c => c.status === 'overdue').length
    const totalPoints = chores.reduce((sum, c) => sum + c.points, 0)

    return { completed, pending, overdue, totalPoints }
  }, [chores])

  // ❌ Avoid: Memoizing simple calculations
  const count = useMemo(() => chores.length, [chores]) // Not needed

  return <div>{/* Statistics display */}</div>
}
```

#### **useCallback for Event Handlers**
```typescript
function ChoreList({ chores, onChoreComplete }: ChoreListProps) {
  // ✅ Good: Callback when passed to memoized children
  const handleChoreComplete = useCallback((choreId: string) => {
    onChoreComplete(choreId)
  }, [onChoreComplete])

  return (
    <div>
      {chores.map(chore => (
        <MemoizedChoreCard
          key={chore.id}
          chore={chore}
          onComplete={handleChoreComplete} // Stable reference
        />
      ))}
    </div>
  )
}

// ❌ Avoid: Callback for non-memoized children or simple handlers
function SimpleComponent({ onClick }: { onClick: () => void }) {
  const handleClick = useCallback(() => {
    onClick()
  }, [onClick]) // Not needed if child isn't memoized

  return <button onClick={handleClick}>Click me</button>
}
```

### **2. Lazy Loading & Code Splitting**
```typescript
// ✅ Good: Lazy load heavy components
const ChoreSubmissionModal = lazy(() => import('./chore-submission-modal'))
const GamificationDashboard = lazy(() => import('./gamification-dashboard'))
const AdminPanel = lazy(() => import('./admin-panel'))

function ChoreCard({ chore }: ChoreCardProps) {
  const [showSubmission, setShowSubmission] = useState(false)

  return (
    <Card>
      {/* Card content */}
      {showSubmission && (
        <Suspense fallback={<ModalSkeleton />}>
          <ChoreSubmissionModal
            chore={chore}
            onClose={() => setShowSubmission(false)}
          />
        </Suspense>
      )}
    </Card>
  )
}

// ✅ Good: Route-based code splitting
const DashboardPage = lazy(() => import('./dashboard/page'))
const ChoresPage = lazy(() => import('./chores/page'))
const ProfilePage = lazy(() => import('./profile/page'))
```

### **3. Virtual Scrolling for Large Lists**
```typescript
// For large lists (100+ items), use virtual scrolling
import { FixedSizeList as List } from 'react-window'

interface VirtualChoreListProps {
  chores: Chore[]
  height: number
}

function VirtualChoreList({ chores, height }: VirtualChoreListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ChoreCard chore={chores[index]} />
    </div>
  )

  return (
    <List
      height={height}
      itemCount={chores.length}
      itemSize={120} // Height of each chore card
    >
      {Row}
    </List>
  )
}
```

### **4. Image Optimization**
```typescript
// ✅ Good: Next.js Image component with optimization
import Image from 'next/image'

function ChoreSubmissionImage({ submission }: { submission: ChoreSubmission }) {
  return (
    <Image
      src={submission.imageUrl}
      alt={`Completion proof for ${submission.choreTitle}`}
      width={300}
      height={200}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." // Low-res placeholder
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="rounded-lg object-cover"
    />
  )
}

// ✅ Good: Progressive loading for galleries
function ChoreGallery({ submissions }: { submissions: ChoreSubmission[] }) {
  const [visibleCount, setVisibleCount] = useState(12)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {submissions.slice(0, visibleCount).map(submission => (
          <ChoreSubmissionImage key={submission.id} submission={submission} />
        ))}
      </div>

      {visibleCount < submissions.length && (
        <Button onClick={() => setVisibleCount(prev => prev + 12)}>
          Load More
        </Button>
      )}
    </div>
  )
}
```

---

## 🧩 Component Composition Patterns

### **1. Compound Components**
```typescript
// ✅ Good: Compound component pattern for flexible APIs
interface ChoreCardContextType {
  chore: Chore
  isExpanded: boolean
  toggleExpanded: () => void
}

const ChoreCardContext = createContext<ChoreCardContextType | null>(null)

export function ChoreCard({ children, chore }: { children: React.ReactNode; chore: Chore }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const value = {
    chore,
    isExpanded,
    toggleExpanded: () => setIsExpanded(!isExpanded),
  }

  return (
    <ChoreCardContext.Provider value={value}>
      <Card className="chore-card">
        {children}
      </Card>
    </ChoreCardContext.Provider>
  )
}

ChoreCard.Header = function ChoreCardHeader({ children }: { children: React.ReactNode }) {
  const context = useContext(ChoreCardContext)
  if (!context) throw new Error('ChoreCard.Header must be used within ChoreCard')

  return (
    <CardHeader onClick={context.toggleExpanded} className="cursor-pointer">
      {children}
    </CardHeader>
  )
}

ChoreCard.Content = function ChoreCardContent({ children }: { children: React.ReactNode }) {
  const context = useContext(ChoreCardContext)
  if (!context) throw new Error('ChoreCard.Content must be used within ChoreCard')

  if (!context.isExpanded) return null

  return <CardContent>{children}</CardContent>
}

// Usage
function ChoreList({ chores }: { chores: Chore[] }) {
  return (
    <div>
      {chores.map(chore => (
        <ChoreCard key={chore.id} chore={chore}>
          <ChoreCard.Header>
            <h3>{chore.title}</h3>
            <Badge>{chore.status}</Badge>
          </ChoreCard.Header>
          <ChoreCard.Content>
            <p>{chore.description}</p>
            <Button>Complete</Button>
          </ChoreCard.Content>
        </ChoreCard>
      ))}
    </div>
  )
}
```

### **2. Render Props Pattern**
```typescript
// ✅ Good: Render props for data fetching components
interface DataFetcherProps<T> {
  queryKey: string[]
  queryFn: () => Promise<T>
  children: (data: {
    data: T | undefined
    loading: boolean
    error: Error | null
    refetch: () => void
  }) => React.ReactNode
}

function DataFetcher<T>({ queryKey, queryFn, children }: DataFetcherProps<T>) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn,
  })

  return (
    <>
      {children({
        data,
        loading: isLoading,
        error,
        refetch,
      })}
    </>
  )
}

// Usage
function ChoreListPage() {
  return (
    <DataFetcher
      queryKey={choreKeys.byTenant(tenantId)}
      queryFn={() => getChoresByTenant(tenantId)}
    >
      {({ data: chores, loading, error, refetch }) => {
        if (loading) return <ChoreListSkeleton />
        if (error) return <ErrorMessage error={error} onRetry={refetch} />
        if (!chores?.length) return <EmptyChoreList />

        return <ChoreList chores={chores} />
      }}
    </DataFetcher>
  )
}
```

### **3. Higher-Order Components (HOCs)**
```typescript
// ✅ Good: HOC for common functionality
function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={<ErrorFallback />}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}

function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithLoadingComponent(
    props: P & { loading?: boolean; loadingComponent?: React.ReactNode }
  ) {
    const { loading, loadingComponent, ...restProps } = props

    if (loading) {
      return <>{loadingComponent || <Spinner />}</>
    }

    return <WrappedComponent {...(restProps as P)} />
  }
}

// Usage
const ChoreListWithErrorBoundary = withErrorBoundary(ChoreList)
const ChoreListWithLoading = withLoading(ChoreListWithErrorBoundary)
```

### **4. Custom Hooks for Logic Reuse**
```typescript
// ✅ Good: Custom hooks for reusable logic
function useChoreCompletion(choreId: string) {
  const [isCompleting, setIsCompleting] = useState(false)
  const { mutate: completeChore } = useCompleteChore()

  const handleComplete = useCallback(async () => {
    setIsCompleting(true)

    try {
      await completeChore({ choreId })
      toast.success('Chore completed!')
    } catch (error) {
      toast.error('Failed to complete chore')
    } finally {
      setIsCompleting(false)
    }
  }, [choreId, completeChore])

  return {
    isCompleting,
    handleComplete,
  }
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}
```

---

## 🚨 Error Handling & Loading States

### **1. Error Boundaries**
```typescript
// components/error-boundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Send to error reporting service
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="p-6 text-center">
      <h2>Something went wrong</h2>
      <details className="mt-4">
        <summary>Error details</summary>
        <pre className="mt-2 text-left">{error.message}</pre>
      </details>
      <Button onClick={retry} className="mt-4">
        Try again
      </Button>
    </div>
  )
}
```

### **2. Loading States & Skeletons**
```typescript
// components/skeletons.tsx
export function ChoreCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ChoreListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ChoreCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Usage in components
function ChoreList({ tenantId }: { tenantId: string }) {
  const { data: chores, isLoading, error } = useChores(tenantId)

  if (isLoading) return <ChoreListSkeleton />
  if (error) return <ErrorMessage error={error} />
  if (!chores?.length) return <EmptyState />

  return (
    <div className="space-y-4">
      {chores.map(chore => (
        <ChoreCard key={chore.id} chore={chore} />
      ))}
    </div>
  )
}
```

### **3. Progressive Enhancement**
```typescript
// hooks/use-progressive-enhancement.ts
function useProgressiveEnhancement() {
  const [isEnhanced, setIsEnhanced] = useState(false)

  useEffect(() => {
    // Only enable enhanced features after hydration
    setIsEnhanced(true)
  }, [])

  return isEnhanced
}

// Usage
function ChoreCard({ chore }: ChoreCardProps) {
  const isEnhanced = useProgressiveEnhancement()

  return (
    <Card>
      <CardHeader>
        <h3>{chore.title}</h3>
        {isEnhanced ? (
          <AnimatedBadge status={chore.status} />
        ) : (
          <Badge>{chore.status}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {isEnhanced && (
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <ChoreInteractions chore={chore} />
          </Suspense>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 📝 Naming Conventions

### **1. File & Component Names**
```
✅ Good:
- ChoreCard.tsx (PascalCase for components)
- use-chore-completion.ts (kebab-case for hooks)
- chore-api.ts (kebab-case for utilities)
- types.ts (lowercase for type files)

❌ Avoid:
- choreCard.tsx (camelCase)
- Chore_Card.tsx (snake_case)
- CHORE-CARD.tsx (SCREAMING-KEBAB-CASE)
```

### **2. Variable & Function Names**
```typescript
// ✅ Good: Descriptive, clear naming
const choreCompletionHandler = () => {}
const isChoreCompleting = true
const totalPointsEarned = 150
const choresByStatus = groupBy(chores, 'status')

// ✅ Good: Boolean naming
const isLoading = true
const hasError = false
const canEditChore = true
const shouldShowModal = false

// ✅ Good: Event handler naming
const handleChoreComplete = () => {}
const handleModalClose = () => {}
const handleFormSubmit = () => {}

// ❌ Avoid: Unclear or misleading names
const data = []
const temp = {}
const flag = true
const thing = null
```

### **3. Prop Names**
```typescript
// ✅ Good: Clear, consistent prop naming
interface ChoreCardProps {
  chore: Chore                          // Main data
  variant?: 'compact' | 'detailed'      // Variants
  showAssignee?: boolean                // Boolean flags
  className?: string                    // Styling
  onComplete?: (choreId: string) => void // Event handlers
  onEdit?: (chore: Chore) => void
}

// ✅ Good: Render prop naming
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderLoading?: () => React.ReactNode
}

// ❌ Avoid: Generic or unclear names
interface Props {
  data: any
  callback: Function
  flag: boolean
}
```

---

## 📁 File Organization

### **1. Component File Structure**
```
src/
├── components/
│   ├── ui/                     # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── chores/                 # Feature-specific components
│   │   ├── chore-card.tsx
│   │   ├── chore-list.tsx
│   │   ├── chore-form.tsx
│   │   └── index.ts            # Barrel exports
│   ├── gamification/
│   │   ├── points-display.tsx
│   │   ├── achievement-badge.tsx
│   │   └── leaderboard.tsx
│   └── common/                 # Shared components
│       ├── error-boundary.tsx
│       ├── loading-spinner.tsx
│       └── empty-state.tsx
├── hooks/                      # Custom hooks
│   ├── use-chore-completion.ts
│   ├── use-local-storage.ts
│   └── use-progressive-enhancement.ts
├── lib/                        # Utilities and configurations
│   ├── api/                    # API layer
│   ├── queries/                # TanStack Query hooks
│   ├── stores/                 # Zustand stores
│   ├── utils.ts                # Utility functions
│   └── constants.ts            # App constants
└── types/                      # TypeScript types
    ├── api.ts                  # API types
    ├── components.ts           # Component types
    └── global.ts               # Global types
```

### **2. Barrel Exports**
```typescript
// components/chores/index.ts
export { ChoreCard } from './chore-card'
export { ChoreList } from './chore-list'
export { ChoreForm } from './chore-form'
export type { ChoreCardProps, ChoreListProps, ChoreFormProps } from './types'

// Usage
import { ChoreCard, ChoreList, ChoreForm } from '@/components/chores'
```

### **3. Import Order**
```typescript
// ✅ Good: Consistent import order
// 1. React and Next.js
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { useQuery } from '@tanstack/react-query'
import { cn } from 'clsx'

// 3. Internal utilities and types
import { getChoresByTenant } from '@/lib/api'
import { useAppStore } from '@/lib/stores'
import type { Chore } from '@/types'

// 4. Internal components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChoreCard } from '@/components/chores'

// 5. Relative imports
import './chore-list.css'
```

---

## 🧪 Testing Guidelines

### **1. Component Testing**
```typescript
// __tests__/components/chore-card.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChoreCard } from '@/components/chores/chore-card'
import type { Chore } from '@/types'

const mockChore: Chore = {
  id: '1',
  title: 'Clean room',
  description: 'Clean and organize bedroom',
  status: 'pending',
  points: 10,
  // ... other required fields
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('ChoreCard', () => {
  it('displays chore title and description', () => {
    renderWithProviders(<ChoreCard chore={mockChore} />)

    expect(screen.getByText('Clean room')).toBeInTheDocument()
    expect(screen.getByText('Clean and organize bedroom')).toBeInTheDocument()
  })

  it('calls onComplete when complete button is clicked', async () => {
    const onComplete = jest.fn()

    renderWithProviders(
      <ChoreCard chore={mockChore} onComplete={onComplete} />
    )

    fireEvent.click(screen.getByText('Complete'))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(mockChore.id)
    })
  })

  it('shows loading state when completing', async () => {
    const onComplete = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))

    renderWithProviders(
      <ChoreCard chore={mockChore} onComplete={onComplete} />
    )

    fireEvent.click(screen.getByText('Complete'))

    expect(screen.getByText('Completing...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Completing...')).not.toBeInTheDocument()
    })
  })
})
```

### **2. Hook Testing**
```typescript
// __tests__/hooks/use-chore-completion.test.ts
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useChoreCompletion } from '@/hooks/use-chore-completion'

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useChoreCompletion', () => {
  it('starts with isCompleting as false', () => {
    const { result } = renderHook(
      () => useChoreCompletion('chore-1'),
      { wrapper }
    )

    expect(result.current.isCompleting).toBe(false)
  })

  it('sets isCompleting to true when handleComplete is called', async () => {
    const { result } = renderHook(
      () => useChoreCompletion('chore-1'),
      { wrapper }
    )

    act(() => {
      result.current.handleComplete()
    })

    expect(result.current.isCompleting).toBe(true)
  })
})
```

### **3. Integration Testing**
```typescript
// __tests__/integration/chore-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { App } from '@/app'

const server = setupServer(
  rest.get('/api/chores', (req, res, ctx) => {
    return res(ctx.json([mockChore]))
  }),

  rest.post('/api/chores/:id/complete', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Chore completion flow', () => {
  it('allows user to complete a chore', async () => {
    render(<App />)

    // Wait for chores to load
    await waitFor(() => {
      expect(screen.getByText('Clean room')).toBeInTheDocument()
    })

    // Click complete button
    fireEvent.click(screen.getByText('Complete'))

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Chore completed!')).toBeInTheDocument()
    })
  })
})
```

---

## ✅ Development Checklist

### **Before Writing a Component**
- [ ] Is this a Server Component or Client Component?
- [ ] What state does it need (local, global, server)?
- [ ] Does it need memoization?
- [ ] What are the TypeScript interfaces?
- [ ] How will it handle loading and error states?

### **Before Submitting Code**
- [ ] TypeScript strict mode passes
- [ ] No ESLint errors or warnings
- [ ] Component is tested
- [ ] Proper accessibility attributes
- [ ] Performance considerations addressed
- [ ] Error boundaries in place
- [ ] Loading states implemented

### **Performance Review**
- [ ] No unnecessary re-renders
- [ ] Proper memoization where needed
- [ ] Code splitting for large components
- [ ] Images optimized
- [ ] Bundle size impact considered

---

*This document should be referenced during development to maintain consistent, high-quality React code across the Tiggpro frontend.*

*Last updated: September 19, 2025*
*Version: 1.0.0*
