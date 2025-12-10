'use client'

import { usePathname } from 'next/navigation'
import {
  Home,
  CheckSquare,
  Users,
  Eye,
  Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useNavigationTranslations } from '@/hooks/use-translations'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useLocale } from '@/hooks/use-locale'
import { TenantMemberRole } from '@tiggpro/shared'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: TenantMemberRole[]
}

interface DashboardNavigationProps {
  userRole: string
  pendingCount?: number
  pendingRewardsCount?: number
  isMobile?: boolean
}

export function DashboardNavigation({ userRole, pendingCount = 0, pendingRewardsCount = 0, isMobile = false }: DashboardNavigationProps) {
  const router = useLocalizedRouter()
  const pathname = usePathname()
  const { locale } = useLocale()
  const navT = useNavigationTranslations()

  // Helper function to check if current path matches nav item
  const isPathActive = (href: string, currentPath: string) => {
    // Remove locale prefix from current path for comparison
    const pathWithoutLocale = currentPath.startsWith(`/${locale}`)
      ? currentPath.substring(`/${locale}`.length) || '/'
      : currentPath

    // Direct match
    if (pathWithoutLocale === href) return true

    // For dashboard root, also match if path ends with just /dashboard
    if (href === '/dashboard') {
      return pathWithoutLocale === '/dashboard' || pathWithoutLocale === '/'
    }

    return false
  }

  const dynamicNavItems: NavItem[] = [
    {
      href: '/dashboard',
      label: navT('dashboard'),
      icon: Home,
    },
    {
      href: '/dashboard/chores',
      label: navT('chores'),
      icon: CheckSquare,
      roles: [TenantMemberRole.ADMIN, TenantMemberRole.PARENT],
    },
    {
      href: '/dashboard/review',
      label: navT('review'),
      icon: Eye,
      roles: [TenantMemberRole.ADMIN, TenantMemberRole.PARENT],
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      href: '/dashboard/rewards',
      label: navT('rewards'),
      icon: Gift,
      badge: pendingRewardsCount > 0 ? pendingRewardsCount : undefined,
      // visible to all roles, but badge only shows for parents/admins
    },
    {
      href: '/dashboard/family',
      label: navT('family'),
      icon: Users,
      roles: [TenantMemberRole.ADMIN, TenantMemberRole.PARENT],
    },
  ]

  const filteredNavItems = dynamicNavItems.filter(item =>
    !item.roles || item.roles.includes(userRole as TenantMemberRole)
  )

  if (isMobile) {
    return (
      <nav className="flex flex-1">
        {filteredNavItems.slice(0, 4).map((item) => {
          const isActive = isPathActive(item.href, pathname)
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex-1 flex-col h-14 min-w-0 gap-0.5 relative rounded-none",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => router.push(item.href)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-tight truncate max-w-full px-1">{item.label}</span>
              {item.badge && (
                <Badge
                  variant="destructive"
                  className="absolute top-1 end-1 h-4 min-w-4 p-0 text-[10px] flex items-center justify-center"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="flex-1 px-4 py-6">
      <ul className="space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = isPathActive(item.href, pathname)
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 rtl:justify-start",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => router.push(item.href)}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left rtl:text-right">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-auto rtl:ml-0 rtl:mr-auto",
                      isActive && "bg-primary-foreground/20 text-primary-foreground"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}