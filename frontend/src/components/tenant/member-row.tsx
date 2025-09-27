'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/role-badge'
import { Button } from '@/components/ui/button'
import { Users, Settings } from 'lucide-react'
import type { TenantMember } from '@/lib/api/tenants'
import { TenantMemberRole } from '@tiggpro/shared'
import { RoleChangeDialog } from './role-change-dialog'

interface MemberRowProps {
  member: TenantMember
  isAdmin: boolean
  tenantId: string
  onRemove?: () => void
  actions?: React.ReactNode
}

export function MemberRow({ member, isAdmin, tenantId, onRemove, actions }: MemberRowProps) {
  const [isRoleChangeOpen, setIsRoleChangeOpen] = useState(false)

  // Only allow admins to change roles, and don't allow changing admin role
  const canChangeRole = isAdmin && member.role !== TenantMemberRole.ADMIN

  return (
    <>
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
          {canChangeRole && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRoleChangeOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {actions}
        </div>
      </div>

      <RoleChangeDialog
        open={isRoleChangeOpen}
        onOpenChange={setIsRoleChangeOpen}
        member={member}
        tenantId={tenantId}
        onSuccess={() => setIsRoleChangeOpen(false)}
      />
    </>
  )
}


