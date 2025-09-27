'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTenant } from '@/lib/contexts/tenant-context'
import { TenantMemberRole } from '@tiggpro/shared'

type Theme = 'light' | 'dark'
type UserTheme = 'parent' | 'kid'

interface ThemeContextType {
  theme: Theme
  userTheme: UserTheme
  setTheme: (theme: Theme) => void
  setUserTheme: (userTheme: UserTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [userTheme, setUserTheme] = useState<UserTheme>('parent')
  const { currentTenant } = useTenant()

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('tiggpro-theme') as Theme

    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Auto-set user theme based on current tenant role
  useEffect(() => {
    if (currentTenant?.role) {
      const roleBasedTheme: UserTheme = currentTenant.role === TenantMemberRole.CHILD ? 'kid' : 'parent'
      setUserTheme(roleBasedTheme)
    }
  }, [currentTenant?.role])

  // Apply theme classes to document
  useEffect(() => {
    const root = window.document.documentElement

    // Remove all theme classes
    root.classList.remove('light', 'dark', 'theme-parent', 'theme-kid')

    // Add current theme classes
    root.classList.add(theme, `theme-${userTheme}`)

    // Save theme to localStorage (userTheme is now auto-determined by role)
    localStorage.setItem('tiggpro-theme', theme)
  }, [theme, userTheme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  const value = {
    theme,
    userTheme,
    setTheme,
    setUserTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook for theme-aware CSS classes
export const useThemeClasses = () => {
  const { theme, userTheme } = useTheme()

  return {
    theme,
    userTheme,
    themeClasses: `${theme} theme-${userTheme}`,
    isDark: theme === 'dark',
    isKidTheme: userTheme === 'kid',
    isParentTheme: userTheme === 'parent',
  }
}
