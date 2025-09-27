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
  Shield,
  Baby,
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { RoleBadge } from '@/components/ui/role-badge'
import { PageHeader } from '@/components/layout/page-header'
import { TenantListItem } from '@/components/tenant/tenant-list-item'
import { MemberRow } from '@/components/tenant/member-row'
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
import { tenantsApi, UserTenant } from '@/lib/api/tenants'
import { TenantMemberRole } from '@tiggpro/shared'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { usePagesTranslations } from '@/hooks/use-translations'

export default function FamilyPage() {
  const [selectedTenant, setSelectedTenant] = useState<UserTenant | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [deletingTenant, setDeletingTenant] = useState<UserTenant | null>(null)
  const queryClient = useQueryClient()
  const p = usePagesTranslations()

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
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member')
    },
  })

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: (tenantId: string) => tenantsApi.deleteTenant(tenantId),
    onSuccess: () => {
      toast.success('Family deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['tenants', 'my'] })
      setSelectedTenant(null) // Clear selected tenant
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete family')
    },
  })

  const tenants = tenantsResponse?.success ? tenantsResponse.data ?? [] : []
  const members = membersResponse?.success ? membersResponse.data ?? [] : []

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

  // Role colors unified by RoleBadge component

  const isAdmin = selectedTenant?.role === TenantMemberRole.ADMIN
  const canManageMembers = selectedTenant?.role === TenantMemberRole.ADMIN ||
    selectedTenant?.role === TenantMemberRole.PARENT

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={p('family.title')}
        subtitle={p('family.subtitle')}
        actions={(
          <>
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  {p('family.join')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{p('family.join')}</DialogTitle>
                  <DialogDescription>{p('family.createOrJoin')}</DialogDescription>
                </DialogHeader>
                <JoinTenantForm onSuccess={() => {
                  setIsJoinDialogOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['tenants', 'my'] })
                }} />
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {p('family.create')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{p('family.create')}</DialogTitle>
                  <DialogDescription>{p('family.subtitle')}</DialogDescription>
                </DialogHeader>
                <CreateTenantForm onSuccess={() => {
                  setIsCreateDialogOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['tenants', 'my'] })
                }} />
              </DialogContent>
            </Dialog>
          </>
        )}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Family List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {p('family.myFamilies')}
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
              <EmptyState
                icon={<Users className="h-12 w-12 text-muted-foreground" />}
                title={p('family.noFamilies')}
                description={p('family.createOrJoin')}
              />
            ) : (
              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <TenantListItem
                    key={tenant.membershipId}
                    tenant={tenant}
                    selected={selectedTenant?.membershipId === tenant.membershipId}
                    onClick={() => setSelectedTenant(tenant)}
                  />
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
                              {p('family.inviteMember')}
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
                      {selectedTenant.role === TenantMemberRole.ADMIN && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                          onClick={() => setDeletingTenant(selectedTenant)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {p('family.deleteFamily')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <label className="text-sm font-medium">{p('family.familyCode')}</label>
                      <p className="text-lg font-mono font-bold tracking-wider">
                        {selectedTenant.tenant.tenantCode}
                      </p>
                      <p className="text-xs text-muted-foreground">{p('family.inviteCopyHint')}</p>
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
                  <CardTitle>{p('family.familyMembers')}</CardTitle>
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
                    <EmptyState
                      icon={<Users className="h-12 w-12 text-muted-foreground" />}
                      title={p('family.noMembers')}
                      description={p('family.noMembersDesc')}
                    />
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <MemberRow
                          key={member.id}
                          member={member}
                          isAdmin={isAdmin}
                          tenantId={selectedTenant.tenant.id}
                          actions={isAdmin && member.role !== TenantMemberRole.ADMIN ? (
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
                          ) : null}
                        />
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
                <h3 className="text-lg font-semibold mb-2">{p('family.selectFamilyTitle')}</h3>
                <p className="text-muted-foreground">{p('family.selectFamilyDesc')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Family Confirmation Dialog */}
      <AlertDialog open={!!deletingTenant} onOpenChange={(open) => !open && setDeletingTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingTenant?.tenant.name}&rdquo;?
              This action cannot be undone and will permanently remove:
              <br />
              <br />
              • All family members
              <br />
              • All chores and assignments
              <br />
              • All points and achievements
              <br />
              • All family data
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTenant) {
                  deleteTenantMutation.mutate(deletingTenant.tenant.id)
                  setDeletingTenant(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Family
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
