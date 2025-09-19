'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserTenant } from '@/lib/api/tenants'

interface TenantContextType {
  currentTenant: UserTenant | null
  setCurrentTenant: (tenant: UserTenant | null) => void
  isLoading: boolean
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

interface TenantProviderProps {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<UserTenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved tenant from localStorage on mount
    const savedTenant = localStorage.getItem('currentTenant')
    if (savedTenant) {
      try {
        const tenant = JSON.parse(savedTenant)
        setCurrentTenant(tenant)
      } catch (error) {
        console.error('Failed to parse saved tenant:', error)
        localStorage.removeItem('currentTenant')
      }
    }
    setIsLoading(false)
  }, [])

  const handleSetCurrentTenant = (tenant: UserTenant | null) => {
    setCurrentTenant(tenant)
    // Persist to localStorage
    if (tenant) {
      localStorage.setItem('currentTenant', JSON.stringify(tenant))
    } else {
      localStorage.removeItem('currentTenant')
    }
  }

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant: handleSetCurrentTenant,
        isLoading
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
