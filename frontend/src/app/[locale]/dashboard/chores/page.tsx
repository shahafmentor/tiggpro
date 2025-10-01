'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  CheckSquare,
  Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EditChoreModal } from '@/components/chores/edit-chore-modal'
import { AssignChoreModal } from '@/components/chores/assign-chore-modal'
import { SubmitAssignmentModal } from '@/components/chores/submit-assignment-modal'
import { choresApi, Chore } from '@/lib/api/chores'
import { assignmentsApi, Assignment } from '@/lib/api/assignments'
import { tenantsApi, TenantMember } from '@/lib/api/tenants'
import { TenantMemberRole } from '@tiggpro/shared'
import { toast } from 'sonner'
import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ChoreCard, type ChoreCardData } from '@/components/chores/chore-card'
import { usePagesTranslations } from '@/hooks/use-translations'

interface ChoreWithAssignment {
  id: string
  title: string
  description: string
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  assignedTo?: {
    name: string
    avatar?: string
  }
  dueDate: string
  estimatedTime: number // in minutes
  assignment?: Assignment // Assignment contains the status
}

export default function ChoresPage() {
  const [editingChore, setEditingChore] = useState<Chore | null>(null)
  const [deletingChore, setDeletingChore] = useState<Chore | null>(null)
  const [assigningChore, setAssigningChore] = useState<Chore | null>(null)
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null)
  const router = useLocalizedRouter()
  const { data: session } = useSession()
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const p = usePagesTranslations()

  // Fetch real chores data
  const { data: choresResponse, isLoading } = useQuery({
    queryKey: ['chores', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? choresApi.getChoresByTenant(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session,
  })

  // Fetch assignments data
  const { data: assignmentsResponse } = useQuery({
    queryKey: ['assignments', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? assignmentsApi.getUserAssignments(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session,
  })

  // Fetch tenant members for assignment display
  const { data: membersResponse } = useQuery({
    queryKey: ['tenantMembers', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? tenantsApi.getTenantMembers(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session,
  })

  const chores: Chore[] = choresResponse?.success ? choresResponse.data || [] : []
  const assignments: Assignment[] = assignmentsResponse?.success ? assignmentsResponse.data || [] : []
  const tenantMembers: TenantMember[] = membersResponse?.success ? membersResponse.data || [] : []

  // Convert real chores to display format with assignment data
  const isChild = currentTenant?.role === TenantMemberRole.CHILD

  const displayChores = chores
    .map((chore): ChoreWithAssignment => {
      // Find assignment for this chore
      const assignment = assignments.find(a => a.choreId === chore.id)

      // Find assigned member details
      const assignedMember = assignment
        ? tenantMembers.find(m => m.userId === assignment.assignedTo?.id)
        : undefined

      return {
        id: chore.id,
        title: chore.title,
        description: chore.description || 'No description provided',
        points: chore.pointsReward,
        difficulty: chore.difficultyLevel.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
        assignedTo: assignedMember ? {
          name: assignedMember.user.displayName || assignedMember.user.email,
          avatar: assignedMember.user.avatarUrl,
        } : undefined,
        dueDate: assignment?.dueDate
          ? new Date(assignment.dueDate).toLocaleDateString()
          : 'No due date',
        estimatedTime: chore.estimatedDurationMinutes,
        assignment, // Assignment contains the status
      }
    })
    .filter((chore) => {
      // If user is a child, only show chores assigned to them
      if (isChild) {
        return chore.assignment && chore.assignment.assignedTo?.id === session?.user?.id
      }
      // For admins and parents, show all chores
      return true
    })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    )
  }

  if (!session || !currentTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <h2 className="text-2xl font-bold mb-4">{p('chores.noFamilySelectedTitle')}</h2>
        <p className="text-lg mb-8 text-center max-w-md">{p('chores.noFamilySelectedDesc')}</p>
      </div>
    )
  }

  const filteredChores = displayChores

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isChild ? p('chores.titleChild') : p('chores.title')}
        subtitle={isChild ? p('chores.subtitleChild') : p('chores.subtitle')}
        actions={(!isChild) ? (
          <Button className="gap-2" onClick={() => router.push('/dashboard/chores/new')}>
            <Plus className="h-4 w-4" />
            {p('chores.addChore')}
          </Button>
        ) : undefined}
      />

      {/* Chore Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChores.map((chore) => (
          <ChoreCard
            key={chore.id}
            chore={chore as unknown as ChoreCardData}
            isChild={isChild}
            onClick={(id) => {
              const originalChore = chores.find(c => c.id === id)
              if (originalChore) setEditingChore(originalChore)
            }}
            onAssign={(id) => {
              const originalChore = chores.find(c => c.id === id)
              if (originalChore) setAssigningChore(originalChore)
            }}
            onSubmitAssignment={(assignment) => setSubmittingAssignment(assignment)}
            onDelete={(id) => {
              const originalChore = chores.find(c => c.id === id)
              if (originalChore) setDeletingChore(originalChore)
            }}
            onEdit={(id) => {
              const originalChore = chores.find(c => c.id === id)
              if (originalChore) setEditingChore(originalChore)
            }}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredChores.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={<CheckSquare className="h-12 w-12 text-muted-foreground" />}
              title={p('chores.noChores')}
              description={p('chores.createFirst')}
              action={(
                <Button onClick={() => router.push('/dashboard/chores/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {p('chores.addFirst')}
                </Button>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Chore Modal */}
      <EditChoreModal
        chore={editingChore}
        open={!!editingChore}
        onOpenChange={(open) => !open && setEditingChore(null)}
        onSuccess={() => {
          toast.success('Chore updated successfully!')
          setEditingChore(null)
          // Refetch chores to show updated data
          queryClient.invalidateQueries({ queryKey: ['chores', currentTenant?.tenant.id] })
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingChore} onOpenChange={(open) => !open && setDeletingChore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingChore?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingChore && currentTenant) {
                  try {
                    const response = await choresApi.deleteChore(currentTenant.tenant.id, deletingChore.id)
                    if (response.success) {
                      toast.success('Chore deleted successfully!')
                      // Refresh the chores list
                      queryClient.invalidateQueries({ queryKey: ['chores', currentTenant.tenant.id] })
                    } else {
                      toast.error(response.error || 'Failed to delete chore')
                    }
                  } catch (error) {
                    toast.error('Failed to delete chore')
                  }
                  setDeletingChore(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Chore Modal */}
      <AssignChoreModal
        chore={assigningChore}
        open={!!assigningChore}
        onOpenChange={(open) => !open && setAssigningChore(null)}
        onSuccess={() => setAssigningChore(null)}
      />

      {/* Submit Assignment Modal */}
      <SubmitAssignmentModal
        assignment={submittingAssignment}
        open={!!submittingAssignment}
        onOpenChange={(open) => {
          if (!open) setSubmittingAssignment(null)
        }}
      />
    </div>
  )
}
