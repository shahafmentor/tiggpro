'use client'

import { Badge } from '@/components/ui/badge'
import { TenantMemberRole } from '@tiggpro/shared'
import { useRolesTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'

interface RoleBadgeProps {
  role: TenantMemberRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const rolesT = useRolesTranslations()

  const getRoleDisplayName = (role: TenantMemberRole) => {
    switch (role) {
      case TenantMemberRole.ADMIN:
        return rolesT('admin')
      case TenantMemberRole.PARENT:
        return rolesT('parent')
      case TenantMemberRole.CHILD:
        return rolesT('child')
      default:
        return role
    }
  }

  const color = (() => {
    switch (role) {
      case TenantMemberRole.ADMIN:
        return 'bg-muted text-foreground'
      case TenantMemberRole.PARENT:
        return 'bg-secondary text-secondary-foreground'
      case TenantMemberRole.CHILD:
        return 'bg-primary/10 text-primary'
      default:
        return 'bg-muted text-foreground'
    }
  })()

  return (
    <Badge variant="secondary" className={cn('text-xs', color, className)}>
      {getRoleDisplayName(role)}
    </Badge>
  )
}


