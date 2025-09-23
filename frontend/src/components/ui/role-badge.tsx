'use client'

import { Badge } from '@/components/ui/badge'
import { TenantMemberRole } from '@tiggpro/shared'
import { cn } from '@/lib/utils'

interface RoleBadgeProps {
  role: TenantMemberRole
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
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
      {role}
    </Badge>
  )
}


