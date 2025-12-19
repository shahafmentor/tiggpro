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
  const isChild = currentTenant?.role === TenantMemberRole.CHILD

  // Fetch real chores data
  const { data: choresResponse, isLoading: choresLoading } = useQuery({
    queryKey: ['chores', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? choresApi.getChoresByTenant(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && !isChild,
  })

  // Fetch assignments data
  const { data: assignmentsResponse, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? assignmentsApi.getUserAssignments(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && isChild,
  })

  const chores: Chore[] = choresResponse?.success ? choresResponse.data || [] : []
  const assignments: Assignment[] = assignmentsResponse?.success ? assignmentsResponse.data || [] : []

  // Convert real chores to display format with assignment data
  const displayChores: ChoreWithAssignment[] = isChild
    ? assignments.map((assignment) => ({
      id: assignment.choreInstanceId,
      title: assignment.chore.title,
      description: assignment.chore.description || p('chores.noDescriptionProvided'),
      points: assignment.chore.pointsReward,
      difficulty: assignment.chore.difficultyLevel.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
      dueDate: assignment.dueDate
        ? new Date(assignment.dueDate).toLocaleDateString()
        : p('chores.noDueDate'),
      estimatedTime: assignment.chore.estimatedDurationMinutes,
      assignment,
    }))
    : chores.map((chore) => ({
      id: chore.id,
      title: chore.title,
      description: chore.description || p('chores.noDescriptionProvided'),
      points: chore.pointsReward,
      difficulty: chore.difficultyLevel.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
      dueDate: p('chores.noDueDate'),
      estimatedTime: chore.estimatedDurationMinutes,
    }))

  const isLoading = isChild ? assignmentsLoading : choresLoading

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
            onClick={isChild ? undefined : (id) => {
              const originalChore = chores.find(c => c.id === id)
              if (originalChore) setEditingChore(originalChore)
            }}
            onAssign={isChild ? undefined : (id) => {
              const originalChore = chores.find(c => c.id === id)
              if (originalChore) setAssigningChore(originalChore)
            }}
            onSubmitAssignment={(assignment) => setSubmittingAssignment(assignment)}
            onDelete={isChild ? undefined : (id) => {
              const originalChore = chores.find(c => c.id === id)
              if (originalChore) setDeletingChore(originalChore)
            }}
            onEdit={isChild ? undefined : (id) => {
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
              description={isChild ? p('chores.subtitleChild') : p('chores.createFirst')}
              action={(
                !isChild ? (
                  <Button onClick={() => router.push('/dashboard/chores/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {p('chores.addFirst')}
                  </Button>
                ) : undefined
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
          toast.success(p('chores.toasts.choreUpdatedSuccess'))
          setEditingChore(null)
          // Refetch chores to show updated data
          queryClient.invalidateQueries({ queryKey: ['chores', currentTenant?.tenant.id] })
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingChore} onOpenChange={(open) => !open && setDeletingChore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p('chores.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {p('chores.deleteDialog.description', { title: deletingChore?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{p('chores.deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingChore && currentTenant) {
                  try {
                    const response = await choresApi.deleteChore(currentTenant.tenant.id, deletingChore.id)
                    if (response.success) {
                      toast.success(p('chores.toasts.choreDeletedSuccess'))
                      // Refresh the chores list
                      queryClient.invalidateQueries({ queryKey: ['chores', currentTenant.tenant.id] })
                    } else {
                      toast.error(response.error || p('chores.toasts.choreDeleteFailed'))
                    }
                  } catch {
                    toast.error(p('chores.toasts.choreDeleteFailed'))
                  }
                  setDeletingChore(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {p('chores.deleteDialog.confirm')}
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
