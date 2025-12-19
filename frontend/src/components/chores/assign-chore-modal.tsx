'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Priority } from '@tiggpro/shared'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { choresApi, AssignChoreRequest, Chore, ActiveTemplateAssignment } from '@/lib/api/chores'
import { tenantsApi, TenantMember } from '@/lib/api/tenants'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { User, Users, Calendar, Flag } from 'lucide-react'
import { useCommonTranslations, useModalsTranslations } from '@/hooks/use-translations'

const getAssignChoreSchema = (modalsT: (key: string) => string) => z.object({
  assignedTo: z.string().min(1, modalsT('assignChore.assignToPlaceholder')),
  dueDate: z.string().min(1, modalsT('assignChore.dueDateLabel')),
  priority: z.nativeEnum(Priority),
  notes: z.string().optional(),
})

type AssignChoreForm = z.infer<ReturnType<typeof getAssignChoreSchema>>

interface AssignChoreModalProps {
  chore: Chore | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AssignChoreModal({ chore, open, onOpenChange, onSuccess }: AssignChoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentTenant } = useTenant()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const commonT = useCommonTranslations()
  const modalsT = useModalsTranslations()

  // Fetch tenant members for assignment dropdown
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['tenantMembers', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? tenantsApi.getTenantMembers(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && open,
  })

  // Template-centric: fetch active assignments for this template (to show "currently assigned" / allow reassign)
  const { data: activeAssignmentsResponse } = useQuery({
    queryKey: ['choreTemplateActiveAssignments', currentTenant?.tenant.id, chore?.id],
    queryFn: () => (currentTenant && chore)
      ? choresApi.getActiveAssignmentsForTemplate(currentTenant.tenant.id, chore.id)
      : null,
    enabled: !!currentTenant && !!session && open && !!chore,
  })

  const tenantMembers: TenantMember[] = (membersResponse?.success && membersResponse.data) ? membersResponse.data : []
  const activeAssignments: ActiveTemplateAssignment[] =
    (activeAssignmentsResponse?.success && activeAssignmentsResponse.data)
      ? activeAssignmentsResponse.data
      : []

  // Best-effort: pick the newest active assignment to show as "currently assigned"
  const currentAssignment = activeAssignments[0] ?? null

  const assignChoreSchema = getAssignChoreSchema(modalsT)

  const form = useForm<AssignChoreForm>({
    resolver: zodResolver(assignChoreSchema),
    defaultValues: {
      assignedTo: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 week from now
      priority: Priority.MEDIUM,
      notes: '',
    },
  })

  // Update form when assignment data changes
  useEffect(() => {
    if (currentAssignment && currentAssignment.assignedTo) {
      form.reset({
        assignedTo: currentAssignment.assignedTo.id,
        dueDate: new Date(currentAssignment.dueDate).toISOString().split('T')[0],
        priority: currentAssignment.priority,
        notes: '', // Notes are not stored in assignment, so keep empty
      })
    } else {
      // Reset to defaults when no assignment exists
      form.reset({
        assignedTo: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: Priority.MEDIUM,
        notes: '',
      })
    }
  }, [currentAssignment, form])

  const assignChoreMutation = useMutation({
    mutationFn: async (data: AssignChoreForm) => {
      if (!currentTenant || !chore) throw new Error('Missing required data')

      const assignmentData: AssignChoreRequest = {
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
        priority: data.priority,
        notes: data.notes,
      }

      return choresApi.assignChore(currentTenant.tenant.id, chore.id, assignmentData)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(modalsT('assignChore.success'))
        queryClient.invalidateQueries({ queryKey: ['chores'] })
        queryClient.invalidateQueries({ queryKey: ['assignments'] })
        queryClient.invalidateQueries({ queryKey: ['choreTemplateActiveAssignments'] })
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(response.error || modalsT('assignChore.failed'))
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : modalsT('assignChore.failed')
      toast.error(errorMessage)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: AssignChoreForm) => {
    setIsSubmitting(true)
    assignChoreMutation.mutate(data)
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'bg-green-100 text-green-800'
      case Priority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800'
      case Priority.HIGH:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentAssignment ? modalsT('assignChore.reassignTitle') : modalsT('assignChore.title')}
          </DialogTitle>
          <DialogDescription>
            {currentAssignment ?
              modalsT('assignChore.reassignDescription').replace('{title}', chore?.title || '') :
              modalsT('assignChore.description').replace('{title}', chore?.title || '')
            }
            {currentAssignment && currentAssignment.assignedTo && (
              <span className="block mt-1 text-xs text-muted-foreground">
                {modalsT('assignChore.currentlyAssigned').replace('{name}', currentAssignment.assignedTo.displayName || currentAssignment.assignedTo.email)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Chore Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{chore?.title}</h4>
              {chore?.description && (
                <p className="text-sm text-muted-foreground mb-2">{chore.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-points-primary/10 text-points-primary">
                  {chore?.pointsReward} points
                </Badge>
                <Badge variant="outline">
                  ~{chore?.estimatedDurationMinutes}min
                </Badge>
              </div>
            </div>

            {/* Assignment Form */}
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{modalsT('assignChore.assignToLabel')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting || membersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={modalsT('assignChore.assignToPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenantMembers.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {member.user.displayName || member.user.email}
                            <Badge variant="outline" className="text-xs">
                              {member.role.toLowerCase()}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {modalsT('assignChore.assignToDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {modalsT('assignChore.dueDateLabel')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isSubmitting}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormDescription>
                    {modalsT('assignChore.dueDateDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    {modalsT('assignChore.priorityLabel')}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={modalsT('assignChore.priorityPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>
                        <Badge variant="secondary" className={getPriorityColor(Priority.LOW)}>
                          {modalsT('assignChore.priorityLow')}
                        </Badge>
                      </SelectItem>
                      <SelectItem value={Priority.MEDIUM}>
                        <Badge variant="secondary" className={getPriorityColor(Priority.MEDIUM)}>
                          {modalsT('assignChore.priorityMedium')}
                        </Badge>
                      </SelectItem>
                      <SelectItem value={Priority.HIGH}>
                        <Badge variant="secondary" className={getPriorityColor(Priority.HIGH)}>
                          {modalsT('assignChore.priorityHigh')}
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {modalsT('assignChore.priorityDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{modalsT('assignChore.notesLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={modalsT('assignChore.notesPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {modalsT('assignChore.notesDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {commonT('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ?
                  (currentAssignment ? modalsT('assignChore.reassigning') : modalsT('assignChore.assigning')) :
                  (currentAssignment ? modalsT('assignChore.reassign') : modalsT('assignChore.assign'))
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

