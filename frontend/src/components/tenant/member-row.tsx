'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/role-badge'
import { Users } from 'lucide-react'
import type { TenantMember } from '@/lib/api/tenants'
import { TenantMemberRole } from '@tiggpro/shared'

interface MemberRowProps {
  member: TenantMember
  isAdmin: boolean
  onRemove?: () => void
  actions?: React.ReactNode
}

export function MemberRow({ member, isAdmin, onRemove, actions }: MemberRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={member.user.avatarUrl} alt={member.user.displayName} />
          <AvatarFallback>
            {member.user.displayName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{member.user.displayName}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{member.user.email}</p>
          <p className="text-xs text-muted-foreground">
            Joined {new Date(member.joinedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RoleBadge role={member.role} />
        {actions}
      </div>
    </div>
  )
}


