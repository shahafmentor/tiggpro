'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Users,
  Crown,
  UserMinus,
  Copy,
  Check,
  UserPlus,
  Settings,
  Shield,
  Baby
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CreateTenantForm } from '@/components/tenant/create-tenant-form'
import { JoinTenantForm } from '@/components/tenant/join-tenant-form'
import { InviteMemberForm } from '@/components/tenant/invite-member-form'
import { tenantsApi, UserTenant, TenantMember } from '@/lib/api/tenants'
import { TenantMemberRole } from '@tiggpro/shared'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function FamilyPage() {
  const [selectedTenant, setSelectedTenant] = useState<UserTenant | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch user's tenants
  const { data: tenantsResponse, isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', 'my'],
    queryFn: () => tenantsApi.getMyTenants(),
  })

  // Fetch selected tenant members
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['tenant-members', selectedTenant?.tenant.id],
    queryFn: () => selectedTenant ? tenantsApi.getTenantMembers(selectedTenant.tenant.id) : null,
    enabled: !!selectedTenant,
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string, userId: string }) =>
      tenantsApi.removeMember(tenantId, userId),
    onSuccess: () => {
      toast.success('Member removed successfully')
      queryClient.invalidateQueries({ queryKey: ['tenant-members'] })
    },
    onError: (error: any) => {
      toast.error(error.error || 'Failed to remove member')
    },
  })

  const tenants = tenantsResponse?.success ? tenantsResponse.data : []
  const members = membersResponse?.success ? membersResponse.data : []

  const handleCopyTenantCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success('Tenant code copied to clipboard!')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error('Failed to copy tenant code')
    }
  }

  const handleRemoveMember = (userId: string) => {
    if (!selectedTenant) return
    removeMemberMutation.mutate({
      tenantId: selectedTenant.tenant.id,
      userId
    })
  }

  const getRoleIcon = (role: TenantMemberRole) => {
    switch (role) {
      case TenantMemberRole.ADMIN:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case TenantMemberRole.PARENT:
        return <Shield className="h-4 w-4 text-blue-500" />
      case TenantMemberRole.CHILD:
        return <Baby className="h-4 w-4 text-green-500" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: TenantMemberRole) => {
    switch (role) {
      case TenantMemberRole.ADMIN:
        return 'bg-yellow-100 text-yellow-800'
      case TenantMemberRole.PARENT:
        return 'bg-blue-100 text-blue-800'
      case TenantMemberRole.CHILD:
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isAdmin = selectedTenant?.role === TenantMemberRole.ADMIN
  const canManageMembers = selectedTenant?.role === TenantMemberRole.ADMIN ||
                           selectedTenant?.role === TenantMemberRole.PARENT

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Family Management</h1>
          <p className="text-muted-foreground">
            Manage your family members and invite new participants
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Join Family
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Family</DialogTitle>
                <DialogDescription>
                  Enter a family code to join an existing family
                </DialogDescription>
              </DialogHeader>
              <JoinTenantForm />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Family
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Family</DialogTitle>
                <DialogDescription>
                  Start a new family and invite members to manage chores together
                </DialogDescription>
              </DialogHeader>
              <CreateTenantForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Family List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Families
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No families yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new family or join an existing one to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.membershipId}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedTenant?.membershipId === tenant.membershipId
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedTenant(tenant)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{tenant.tenant.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleIcon(tenant.role)}
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", getRoleBadgeColor(tenant.role))}
                          >
                            {tenant.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family Details & Members */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTenant ? (
            <>
              {/* Family Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {selectedTenant.tenant.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {canManageMembers && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                              <UserPlus className="h-4 w-4" />
                              Invite Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invite Family Member</DialogTitle>
                              <DialogDescription>
                                Send an invitation to join {selectedTenant.tenant.name}
                              </DialogDescription>
                            </DialogHeader>
                            <InviteMemberForm tenantId={selectedTenant.tenant.id} />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Family Code</label>
                      <p className="text-lg font-mono font-bold tracking-wider">
                        {selectedTenant.tenant.tenantCode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Share this code with family members to invite them
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyTenantCode(selectedTenant.tenant.tenantCode)}
                      disabled={copiedCode === selectedTenant.tenant.tenantCode}
                    >
                      {copiedCode === selectedTenant.tenant.tenantCode ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Members List */}
              <Card>
                <CardHeader>
                  <CardTitle>Family Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse" />
                            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No members found</h3>
                      <p className="text-sm text-muted-foreground">
                        This family doesn't have any members yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                                {getRoleIcon(member.role)}
                              </div>
                              <p className="text-sm text-muted-foreground">{member.user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn("text-xs", getRoleBadgeColor(member.role))}
                            >
                              {member.role}
                            </Badge>
                            {isAdmin && member.role !== TenantMemberRole.ADMIN && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Family Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {member.user.displayName} from this family?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleRemoveMember(member.userId)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove Member
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Family</h3>
                <p className="text-muted-foreground">
                  Choose a family from the list to view members and manage settings
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
