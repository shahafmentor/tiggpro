import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types from shared package - we'll import these properly later
type Tenant = {
  id: string
  name: string
  code: string
  type: 'family' | 'organization'
  createdAt: string
}

type Theme = 'light' | 'dark'
type UserTheme = 'parent' | 'kid'

interface AppState {
  // Current tenant/family
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void

  // UI state
  theme: Theme
  userTheme: UserTheme
  setTheme: (theme: Theme) => void
  setUserTheme: (userTheme: UserTheme) => void

  // Optimistic UI state for better UX
  completingChores: Set<string>
  addCompletingChore: (choreId: string) => void
  removeCompletingChore: (choreId: string) => void
  clearCompletingChores: () => void

  // Navigation state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Mobile bottom sheet state
  bottomSheetOpen: boolean
  setBottomSheetOpen: (open: boolean) => void

  // Loading states for global operations
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Global error state
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Current tenant
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),

      // Theme state
      theme: 'light',
      userTheme: 'parent',
      setTheme: (theme) => set({ theme }),
      setUserTheme: (userTheme) => set({ userTheme }),

      // Optimistic UI state
      completingChores: new Set(),
      addCompletingChore: (choreId) => set(state => ({
        completingChores: new Set([...state.completingChores, choreId])
      })),
      removeCompletingChore: (choreId) => set(state => {
        const newSet = new Set(state.completingChores)
        newSet.delete(choreId)
        return { completingChores: newSet }
      }),
      clearCompletingChores: () => set({ completingChores: new Set() }),

      // Navigation state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Mobile bottom sheet
      bottomSheetOpen: false,
      setBottomSheetOpen: (open) => set({ bottomSheetOpen: open }),

      // Loading state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // Error state
      error: null,
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'tiggpro-app-storage',
      partialize: (state) => ({
        // Only persist these values
        currentTenant: state.currentTenant,
        theme: state.theme,
        userTheme: state.userTheme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Selectors for common state combinations
export const useCurrentTenant = () => useAppStore(state => state.currentTenant)
export const useThemeState = () => useAppStore(state => ({
  theme: state.theme,
  userTheme: state.userTheme
}))
export const useUIState = () => useAppStore(state => ({
  sidebarOpen: state.sidebarOpen,
  bottomSheetOpen: state.bottomSheetOpen,
  isLoading: state.isLoading,
  error: state.error,
}))
export const useOptimisticState = () => useAppStore(state => ({
  completingChores: state.completingChores,
  addCompletingChore: state.addCompletingChore,
  removeCompletingChore: state.removeCompletingChore,
}))
