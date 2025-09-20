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
import { choresApi, AssignChoreRequest, Chore } from '@/lib/api/chores'
import { tenantsApi, TenantMember } from '@/lib/api/tenants'
import { assignmentsApi, Assignment } from '@/lib/api/assignments'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { User, Users, Calendar, Flag } from 'lucide-react'

const assignChoreSchema = z.object({
  assignedTo: z.string().min(1, 'Please select a family member'),
  dueDate: z.string().min(1, 'Please select a due date'),
  priority: z.nativeEnum(Priority),
  notes: z.string().optional(),
})

type AssignChoreForm = z.infer<typeof assignChoreSchema>

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

  // Fetch tenant members for assignment dropdown
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['tenantMembers', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? tenantsApi.getTenantMembers(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && open,
  })

  // Fetch current assignments to check if chore is already assigned
  const { data: assignmentsResponse } = useQuery({
    queryKey: ['assignments', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? assignmentsApi.getUserAssignments(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && open,
  })

  const tenantMembers: TenantMember[] = (membersResponse?.success && membersResponse.data) ? membersResponse.data : []
  const assignments: Assignment[] = (assignmentsResponse?.success && assignmentsResponse.data) ? assignmentsResponse.data : []

  // Find current assignment for this chore
  const currentAssignment = chore ? assignments.find(a => a.choreId === chore.id) : null

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
        toast.success('Chore assigned successfully!')
        queryClient.invalidateQueries({ queryKey: ['chores'] })
        queryClient.invalidateQueries({ queryKey: ['assignments'] })
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(response.error || 'Failed to assign chore')
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign chore'
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
            {currentAssignment ? 'Reassign Chore' : 'Assign Chore'}
          </DialogTitle>
          <DialogDescription>
            {currentAssignment ? 'Reassign' : 'Assign'} &quot;{chore?.title}&quot; to a family member with a due date and priority.
            {currentAssignment && currentAssignment.assignedTo && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Currently assigned to {currentAssignment.assignedTo.displayName || currentAssignment.assignedTo.email}
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
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {chore?.gamingTimeMinutes}min gaming
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
                  <FormLabel>Assign to Family Member</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting || membersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a family member" />
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
                    Choose which family member should complete this chore
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
                    Due Date
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
                    When should this chore be completed?
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
                    Priority
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>
                        <Badge variant="secondary" className={getPriorityColor(Priority.LOW)}>
                          Low Priority
                        </Badge>
                      </SelectItem>
                      <SelectItem value={Priority.MEDIUM}>
                        <Badge variant="secondary" className={getPriorityColor(Priority.MEDIUM)}>
                          Medium Priority
                        </Badge>
                      </SelectItem>
                      <SelectItem value={Priority.HIGH}>
                        <Badge variant="secondary" className={getPriorityColor(Priority.HIGH)}>
                          High Priority
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How urgent is this chore assignment?
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
                  <FormLabel>Assignment Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or notes for the assigned person..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes or instructions for the person assigned to this chore
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (currentAssignment ? 'Reassigning...' : 'Assigning...') : (currentAssignment ? 'Reassign Chore' : 'Assign Chore')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

