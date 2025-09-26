'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DifficultyLevel } from '@tiggpro/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { choresApi, Chore, UpdateChoreRequest } from '@/lib/api/chores'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { useChoresTranslations, useCommonTranslations, useModalsTranslations } from '@/hooks/use-translations'
import {
  Clock,
  Star,
  Zap,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react'

const updateChoreSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  pointsReward: z
    .number()
    .min(1, 'Points must be at least 1')
    .max(1000, 'Points must not exceed 1000'),
  difficultyLevel: z.nativeEnum(DifficultyLevel),
  estimatedDurationMinutes: z
    .number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration must not exceed 8 hours'),
  isRecurring: z.boolean(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly']).optional(),
  weeklyDays: z.array(z.number()).optional(),
  monthlyDay: z.number().min(1).max(31).optional(),
})

type UpdateChoreForm = z.infer<typeof updateChoreSchema>

interface EditChoreModalProps {
  chore: Chore | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditChoreModal({ chore, open, onOpenChange, onSuccess }: EditChoreModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const choresT = useChoresTranslations()
  const commonT = useCommonTranslations()
  const modalsT = useModalsTranslations()

  const weekDays = [
    { value: 1, label: choresT('monday') },
    { value: 2, label: choresT('tuesday') },
    { value: 3, label: choresT('wednesday') },
    { value: 4, label: choresT('thursday') },
    { value: 5, label: choresT('friday') },
    { value: 6, label: choresT('saturday') },
    { value: 0, label: choresT('sunday') },
  ]

  const form = useForm<UpdateChoreForm>({
    resolver: zodResolver(updateChoreSchema),
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
    },
  })

  // Reset form when chore changes
  useEffect(() => {
    if (chore) {
      form.reset({
        title: chore.title,
        description: chore.description || '',
        pointsReward: chore.pointsReward,
        difficultyLevel: chore.difficultyLevel,
        estimatedDurationMinutes: chore.estimatedDurationMinutes,
        isRecurring: chore.isRecurring,
        recurrenceType: chore.recurrencePattern?.type || 'weekly',
        weeklyDays: chore.recurrencePattern?.daysOfWeek || [],
        monthlyDay: chore.recurrencePattern?.dayOfMonth || 1,
      })
    }
  }, [chore, form])

  const updateChoreMutation = useMutation({
    mutationFn: (data: UpdateChoreRequest) => {
      if (!currentTenant || !chore) throw new Error('Missing tenant or chore')
      return choresApi.updateChore(currentTenant.tenant.id, chore.id, data)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(commonT('confirm'))
        queryClient.invalidateQueries({ queryKey: ['chores', currentTenant?.tenant.id] })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(response.error || modalsT('editChore.failed'))
      }
    },
    onError: (error: unknown) => {
      toast.error((error as { error?: string }).error || modalsT('editChore.failed'))
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: UpdateChoreForm) => {
    setIsSubmitting(true)

    // Build the update request object
    const request: UpdateChoreRequest = {
      title: data.title,
      description: data.description || undefined,
      pointsReward: data.pointsReward,
      difficultyLevel: data.difficultyLevel,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      isRecurring: data.isRecurring,
    }

    // Add recurrence pattern if recurring
    if (data.isRecurring && data.recurrenceType) {
      request.recurrencePattern = {
        type: data.recurrenceType,
      }

      if (data.recurrenceType === 'weekly' && data.weeklyDays?.length) {
        request.recurrencePattern.daysOfWeek = data.weeklyDays
      } else if (data.recurrenceType === 'monthly' && data.monthlyDay) {
        request.recurrencePattern.dayOfMonth = data.monthlyDay
      }
    }

    updateChoreMutation.mutate(request)
  }

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

  if (!chore) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalsT('editChore.title')}</DialogTitle>
          <DialogDescription>
            {modalsT('editChore.description').replace('{title}', chore.title)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
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
                    <FormLabel>{choresT('description')}</FormLabel>
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

            {/* Recurrence Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{choresT('recurrenceSettings')}</h3>

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {choresT('recurring')}
                      </FormLabel>
                      <FormDescription>
                        {choresT('help.recurring')}
                      </FormDescription>
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
                                <Calendar className="h-4 w-4" />
                                {choresT('daily')}
                              </div>
                            </SelectItem>
                            <SelectItem value="weekly">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                {choresT('weekly')}
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly">
                              <div className="flex items-center gap-2">
                                <CalendarRange className="h-4 w-4" />
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
                                render={({ field }) => {
                                  return (
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
                                                  field.value?.filter(
                                                    (value) => value !== day.value
                                                  )
                                                )
                                          }}
                                          disabled={isSubmitting}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {day.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {commonT('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? modalsT('editChore.updating') : modalsT('editChore.update')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
