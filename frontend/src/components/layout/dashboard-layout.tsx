'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UserProfileHeader } from '@/components/layout/user-profile-header'
import { TenantSelector } from '@/components/tenant/tenant-selector'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { LanguageSelector } from '@/components/ui/language-selector'
import { DashboardNavigation } from '@/components/layout/dashboard-navigation'
import { useQuery } from '@tanstack/react-query'
import { assignmentsApi } from '@/lib/api/assignments'
import { useTenant } from '@/lib/contexts/tenant-context'
import { TenantMemberRole } from '@tiggpro/shared'
import { useChoresTranslations, useBrandTranslations } from '@/hooks/use-translations'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useLocale } from '@/hooks/use-locale'

interface DashboardLayoutProps {
  children: ReactNode
}


export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useLocalizedRouter()
  const pathname = usePathname()
  const { currentTenant } = useTenant()
  const { direction } = useLocale()
  const choresT = useChoresTranslations()
  const brandT = useBrandTranslations()

  // Check if user has permission to review submissions
  const canReview = currentTenant?.role === TenantMemberRole.ADMIN ||
    currentTenant?.role === TenantMemberRole.PARENT

  // Fetch pending submissions count for review badge
  const { data: pendingSubmissionsResponse } = useQuery({
    queryKey: ['pending-submissions-count', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? assignmentsApi.getPendingSubmissions(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && canReview,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const pendingCount = pendingSubmissionsResponse?.success ?
    (pendingSubmissionsResponse.data || []).length : 0

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/')
    return null
  }

  // Get user role from current tenant context
  const userRole = currentTenant?.role || 'child'

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 rtl:lg:left-auto rtl:lg:right-0">
        <div className="flex flex-col flex-grow bg-card border-r border-border rtl:border-r-0 rtl:border-l">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl text-foreground">{brandT('productName')}</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="px-6 py-4 border-b border-border">
            <UserProfileHeader />
          </div>

          {/* Tenant Selector */}
          <div className="px-6 py-4 border-b border-border">
            <TenantSelector />
          </div>

          {/* Navigation */}
          <DashboardNavigation
            userRole={userRole}
            pendingCount={pendingCount}
          />

          {/* Quick Actions */}
          {userRole !== 'child' && (
            <div className="px-4 pb-6">
              <Button
                className="w-full gap-2"
                onClick={() => router.push('/dashboard/chores/new')}
              >
                <Plus className="h-4 w-4" />
                {choresT('create')}
              </Button>
            </div>
          )}

          <div className="px-4 pb-4 border-t border-border pt-4 space-y-2">
            <ThemeSwitcher />
            <LanguageSelector className="w-full" />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex">
          <DashboardNavigation
            userRole={userRole}
            pendingCount={pendingCount}
            isMobile={true}
          />
          {userRole !== TenantMemberRole.CHILD && (
            <Button
              variant="ghost"
              size="sm"
              className="flex-col h-16 w-16 gap-1"
              onClick={() => router.push('/dashboard/chores/new')}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">{choresT('create')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">T</span>
            </div>
            <span className="font-bold text-xl text-foreground">Tiggpro</span>
          </div>
          <div className={cn(
            "flex items-center gap-2"
          )}>
            <TenantSelector />
            <LanguageSelector variant="compact" />
            {/* MVP: Comment out theme switcher - not essential for core flow */}
            {/* <ThemeSwitcher /> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64">
        <main className="min-h-screen pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
