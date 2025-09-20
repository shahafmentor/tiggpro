'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Home,
  CheckSquare,
  Trophy,
  Users,
  Settings,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { UserProfileHeader } from '@/components/layout/user-profile-header'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { TenantSelector } from '@/components/tenant/tenant-selector'

interface DashboardLayoutProps {
  children: ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: ('ADMIN' | 'PARENT' | 'CHILD')[]
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
    // MVP: Removed mock badge - keep it simple
    // badge: 3, // TODO: Get from real data
  },
  {
    href: '/dashboard/family',
    label: 'Family',
    icon: Users,
    roles: ['ADMIN', 'PARENT'],
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
  const router = useRouter()
  const pathname = usePathname()

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

  // TODO: Get user role from session/context
  const userRole = 'PARENT' // Placeholder

  const filteredNavItems = navItems.filter(item =>
    !item.roles || item.roles.includes(userRole as 'ADMIN' | 'PARENT' | 'CHILD')
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-card border-r border-border">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl text-foreground">Tiggpro</span>
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
              New Chore
            </Button>
          </div>

          {/* MVP: Comment out theme switcher - not essential for core flow */}
          {/* <div className="px-4 pb-4 border-t border-border pt-4">
            <ThemeSwitcher />
          </div> */}
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
            <span className="text-xs">Add</span>
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
          <div className="flex items-center gap-2">
            <TenantSelector />
            {/* MVP: Comment out theme switcher - not essential for core flow */}
            {/* <ThemeSwitcher /> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
