'use client'

import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'
import type { UserTenant } from '@/lib/api/tenants'
import { TenantMemberRole } from '@tiggpro/shared'

interface TenantListItemProps {
  tenant: UserTenant
  selected: boolean
  onClick: () => void
}

export function TenantListItem({ tenant, selected, onClick }: TenantListItemProps) {
  const getRoleIcon = (role: TenantMemberRole) => {
    switch (role) {
      case TenantMemberRole.ADMIN:
      case TenantMemberRole.PARENT:
      case TenantMemberRole.CHILD:
        return <Users className="h-5 w-5" />
      default:
        return <Users className="h-5 w-5" />
    }
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-colors',
        selected ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:bg-muted/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{tenant.tenant.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {getRoleIcon(tenant.role)}
            <RoleBadge role={tenant.role} />
          </div>
        </div>
      </div>
    </div>
  )
}


