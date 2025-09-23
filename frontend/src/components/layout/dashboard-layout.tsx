'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  Home,
  CheckSquare,
  Users,
  Plus,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { UserProfileHeader } from '@/components/layout/user-profile-header'
import { TenantSelector } from '@/components/tenant/tenant-selector'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { LanguageSelector } from '@/components/ui/language-selector'
import { useQuery } from '@tanstack/react-query'
import { assignmentsApi } from '@/lib/api/assignments'
import { useTenant } from '@/lib/contexts/tenant-context'
import { TenantMemberRole } from '@tiggpro/shared'
import { useNavigationTranslations, useChoresTranslations, useBrandTranslations } from '@/hooks/use-translations'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useLocale } from '@/hooks/use-locale'

interface DashboardLayoutProps {
  children: ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: ('admin' | 'parent' | 'child')[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/dashboard/chores',
    label: 'Chores',
    icon: CheckSquare,
  },
  {
    href: '/dashboard/review',
    label: 'Review',
    icon: Eye,
    roles: ['admin', 'parent'],
  },
  {
    href: '/dashboard/family',
    label: 'Family',
    icon: Users,
    roles: ['admin', 'parent'],
  },
  // MVP: Comment out non-essential features
  // {
  //   href: '/dashboard/achievements',
  //   label: 'Achievements',
  //   icon: Trophy,
  // },
  // {
  //   href: '/dashboard/settings',
  //   label: 'Settings',
  //   icon: Settings,
  // },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useLocalizedRouter()
  const pathname = usePathname()
  const { currentTenant } = useTenant()
  const { direction } = useLocale()
  const navT = useNavigationTranslations()
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
  const userRole = currentTenant?.role || 'CHILD'

  // Create dynamic nav items with translations and pending count badge
  const dynamicNavItems = [
    {
      href: '/dashboard',
      label: navT('dashboard'),
      icon: Home,
    },
    {
      href: '/dashboard/chores',
      label: navT('chores'),
      icon: CheckSquare,
    },
    {
      href: '/dashboard/review',
      label: navT('review'),
      icon: Eye,
      roles: ['admin', 'parent'] as const,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      href: '/dashboard/family',
      label: navT('family'),
      icon: Users,
      roles: ['admin', 'parent'] as const,
    },
  ]

  const filteredNavItems = dynamicNavItems.filter(item =>
    !item.roles || item.roles.includes(userRole.toLowerCase() as 'admin' | 'parent')
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0">
        <div className="flex flex-col flex-grow bg-card border-r border-border">
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
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <li key={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-12",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Quick Actions */}
          <div className="px-4 pb-6">
            <Button
              className="w-full gap-2"
              onClick={() => router.push('/dashboard/chores/new')}
            >
              <Plus className="h-4 w-4" />
              {choresT('create')}
            </Button>
          </div>

          <div className="px-4 pb-4 border-t border-border pt-4 space-y-2">
            <ThemeSwitcher />
            <LanguageSelector className="w-full" />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <nav className="flex justify-around py-2">
          {filteredNavItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-col h-16 w-16 gap-1 relative",
                  isActive && "text-primary"
                )}
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            className="flex-col h-16 w-16 gap-1"
            onClick={() => router.push('/dashboard/chores/new')}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">{choresT('create')}</span>
          </Button>
        </nav>
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
      <div className="lg:pl-64">
        <main className="min-h-screen pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
