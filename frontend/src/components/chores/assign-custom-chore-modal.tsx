'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DifficultyLevel, Priority, TenantMemberRole } from '@tiggpro/shared'
import { useSession } from 'next-auth/react'
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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { choresApi, type AssignCustomChoreRequest } from '@/lib/api/chores'
import { tenantsApi, type TenantMember } from '@/lib/api/tenants'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { useChoresTranslations, useCommonTranslations, useModalsTranslations } from '@/hooks/use-translations'
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Flag,
  RefreshCw,
  Star,
  User,
  Users,
  Zap,
} from 'lucide-react'

const weekDays = [
  { value: 1, labelKey: 'monday' },
  { value: 2, labelKey: 'tuesday' },
  { value: 3, labelKey: 'wednesday' },
  { value: 4, labelKey: 'thursday' },
  { value: 5, labelKey: 'friday' },
  { value: 6, labelKey: 'saturday' },
  { value: 0, labelKey: 'sunday' },
] as const

const buildSchema = (modalsT: (key: string) => string) => z.object({
  // Chore fields
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  pointsReward: z.number().min(1).max(1000),
  difficultyLevel: z.nativeEnum(DifficultyLevel),
  estimatedDurationMinutes: z.number().min(5).max(480),
  isRecurring: z.boolean(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  weeklyDays: z.array(z.number()).optional(),
  monthlyDay: z.number().min(1).max(31).optional(),

  // Assignment fields
  assignedTo: z.string().min(1, modalsT('assignChore.assignToPlaceholder')),
  dueDate: z.string().min(1, modalsT('assignChore.dueDateLabel')),
  priority: z.nativeEnum(Priority),
  notes: z.string().optional(),

  // Extra
  saveAsTemplate: z.boolean(),
})

type AssignCustomChoreForm = z.infer<ReturnType<typeof buildSchema>>

interface AssignCustomChoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AssignCustomChoreModal({ open, onOpenChange, onSuccess }: AssignCustomChoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentTenant } = useTenant()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const choresT = useChoresTranslations()
  const commonT = useCommonTranslations()
  const modalsT = useModalsTranslations()

  const form = useForm<AssignCustomChoreForm>({
    resolver: zodResolver(buildSchema(modalsT)),
    defaultValues: {
      title: '',
      description: '',
      pointsReward: 10,
      difficultyLevel: DifficultyLevel.EASY,
      estimatedDurationMinutes: 30,
      isRecurring: false,
      recurrenceType: 'weekly',
      weeklyDays: [],
      monthlyDay: 1,
      assignedTo: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: Priority.MEDIUM,
      notes: '',
      saveAsTemplate: false,
    },
  })

  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['tenantMembers', currentTenant?.tenant.id],
    queryFn: () => (currentTenant ? tenantsApi.getTenantMembers(currentTenant.tenant.id) : null),
    enabled: !!currentTenant && !!session && open,
  })

  const tenantMembers: TenantMember[] = (membersResponse?.success && membersResponse.data) ? membersResponse.data : []
  const childMembers = tenantMembers.filter((m) => m.role === TenantMemberRole.CHILD)
  const hasChildren = childMembers.length > 0

  const mutation = useMutation({
    mutationFn: async (data: AssignCustomChoreForm) => {
      if (!currentTenant) throw new Error('No tenant selected')

      const request: AssignCustomChoreRequest = {
        title: data.title,
        description: data.description || undefined,
        pointsReward: data.pointsReward,
        difficultyLevel: data.difficultyLevel,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        isRecurring: data.isRecurring,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate,
        priority: data.priority,
        notes: data.notes || undefined,
        saveAsTemplate: data.saveAsTemplate,
      }

      if (data.isRecurring && data.recurrenceType) {
        request.recurrencePattern = { type: data.recurrenceType }
        if (data.recurrenceType === 'weekly' && data.weeklyDays?.length) {
          request.recurrencePattern.daysOfWeek = data.weeklyDays
        } else if (data.recurrenceType === 'monthly' && data.monthlyDay) {
          request.recurrencePattern.dayOfMonth = data.monthlyDay
        }
      }

      return choresApi.assignCustomChore(currentTenant.tenant.id, request)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(modalsT('assignCustomChore.success'))
        queryClient.invalidateQueries({ queryKey: ['assignments'] })
        queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
        queryClient.invalidateQueries({ queryKey: ['chores'] })
        form.reset()
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(response.error || modalsT('assignCustomChore.failed'))
      }
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : modalsT('assignCustomChore.failed'))
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const getDifficultyIcon = (level: DifficultyLevel) => {
    switch (level) {
      case DifficultyLevel.EASY:
        return <Star className="h-4 w-4 text-green-500" />
      case DifficultyLevel.MEDIUM:
        return (
          <div className="flex gap-0.5">
            <Star className="h-4 w-4 text-yellow-500" />
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
        )
      case DifficultyLevel.HARD:
        return (
          <div className="flex gap-0.5">
            <Star className="h-4 w-4 text-red-500" />
            <Star className="h-4 w-4 text-red-500" />
            <Star className="h-4 w-4 text-red-500" />
          </div>
        )
    }
  }

  const getRecurrenceIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Calendar className="h-4 w-4" />
      case 'weekly':
        return <CalendarDays className="h-4 w-4" />
      case 'monthly':
        return <CalendarRange className="h-4 w-4" />
      default:
        return <RefreshCw className="h-4 w-4" />
    }
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

  const onSubmit = (data: AssignCustomChoreForm) => {
    setIsSubmitting(true)
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {modalsT('assignCustomChore.title')}
          </DialogTitle>
          <DialogDescription>{modalsT('assignCustomChore.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Chore basics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{choresT('basicInfo')}</h3>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{choresT('title')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={choresT('placeholders.title')}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{choresT('description')} (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={choresT('placeholders.description')}
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficultyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{choresT('difficulty')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={DifficultyLevel.EASY}>
                          <div className="flex items-center gap-2">
                            {getDifficultyIcon(DifficultyLevel.EASY)}
                            {choresT('easy')}
                          </div>
                        </SelectItem>
                        <SelectItem value={DifficultyLevel.MEDIUM}>
                          <div className="flex items-center gap-2">
                            {getDifficultyIcon(DifficultyLevel.MEDIUM)}
                            {choresT('medium')}
                          </div>
                        </SelectItem>
                        <SelectItem value={DifficultyLevel.HARD}>
                          <div className="flex items-center gap-2">
                            {getDifficultyIcon(DifficultyLevel.HARD)}
                            {choresT('hard')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rewards & Duration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{choresT('rewardsDuration')}</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pointsReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-points-primary" />
                        {choresT('points')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimatedDurationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {choresT('duration')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={480}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Recurrence */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{choresT('recurrenceSettings')}</h3>

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{choresT('recurring')}</FormLabel>
                      <FormDescription>{choresT('help.recurring')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('isRecurring') && (
                <>
                  <FormField
                    control={form.control}
                    name="recurrenceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{choresT('recurrencePattern')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">
                              <div className="flex items-center gap-2">
                                {getRecurrenceIcon('daily')}
                                {choresT('daily')}
                              </div>
                            </SelectItem>
                            <SelectItem value="weekly">
                              <div className="flex items-center gap-2">
                                {getRecurrenceIcon('weekly')}
                                {choresT('weekly')}
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                              <div className="flex items-center gap-2">
                                {getRecurrenceIcon('monthly')}
                                {choresT('monthly')}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('recurrenceType') === 'weekly' && (
                    <FormField
                      control={form.control}
                      name="weeklyDays"
                      render={() => (
                        <FormItem>
                          <FormLabel>{choresT('daysOfWeek')}</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {weekDays.map((day) => (
                              <FormField
                                key={day.value}
                                control={form.control}
                                name="weeklyDays"
                                render={({ field }) => (
                                  <FormItem
                                    key={day.value}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(day.value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), day.value])
                                            : field.onChange(
                                              field.value?.filter((v) => v !== day.value)
                                            )
                                        }}
                                        disabled={isSubmitting}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">{choresT(day.labelKey)}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch('recurrenceType') === 'monthly' && (
                    <FormField
                      control={form.control}
                      name="monthlyDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{choresT('dayOfMonth')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </div>

            {/* Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{modalsT('assignChore.title')}</h3>

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{modalsT('assignChore.assignToLabel')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting || membersLoading || !hasChildren}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={modalsT('assignChore.assignToPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {childMembers.map((member) => (
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
                      {hasChildren
                        ? modalsT('assignChore.assignToDescription')
                        : 'No child members available to assign chores to.'}
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
                    <FormDescription>{modalsT('assignChore.dueDateDescription')}</FormDescription>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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
                    <FormDescription>{modalsT('assignChore.priorityDescription')}</FormDescription>
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
                    <FormDescription>{modalsT('assignChore.notesDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Save as template */}
            <FormField
              control={form.control}
              name="saveAsTemplate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {modalsT('assignCustomChore.saveAsTemplateLabel')}
                    </FormLabel>
                    <FormDescription>{modalsT('assignCustomChore.saveAsTemplateDescription')}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
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
              <Button type="submit" disabled={isSubmitting || !hasChildren}>
                {isSubmitting ? modalsT('assignCustomChore.assigning') : modalsT('assignCustomChore.assign')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
