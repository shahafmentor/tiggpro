'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DifficultyLevel } from '@tiggpro/shared'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { choresApi, CreateChoreRequest } from '@/lib/api/chores'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import {
  Clock,
  Star,
  Zap,
  Gamepad2,
  RefreshCw,
  Calendar,
  CalendarDays,
  CalendarRange,
  // Removed Users, User icons - no longer needed for assignment UI
} from 'lucide-react'

const createChoreSchema = z.object({
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
  gamingTimeMinutes: z
    .number()
    .min(0, 'Gaming time cannot be negative')
    .max(480, 'Gaming time must not exceed 8 hours'),
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

type CreateChoreForm = z.infer<typeof createChoreSchema>

interface CreateChoreFormProps {
  onSuccess?: () => void
}

const weekDays = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

export function CreateChoreForm({ onSuccess }: CreateChoreFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()

  // Removed tenant members query - assignments are now handled separately from chore creation

  const form = useForm<CreateChoreForm>({
    resolver: zodResolver(createChoreSchema),
    defaultValues: {
      title: '',
      description: '',
      pointsReward: 10,
      gamingTimeMinutes: 15,
      difficultyLevel: DifficultyLevel.EASY,
      estimatedDurationMinutes: 30,
      isRecurring: false,
      recurrenceType: 'weekly',
      weeklyDays: [],
      monthlyDay: 1,
    },
  })

  const createChoreMutation = useMutation({
    mutationFn: (data: CreateChoreRequest) => {
      if (!currentTenant) throw new Error('No tenant selected')
      return choresApi.createChore(currentTenant.tenant.id, data)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Chore created successfully!')
        queryClient.invalidateQueries({ queryKey: ['chores'] })
        form.reset()
        onSuccess?.()
      } else {
        toast.error(response.error || 'Failed to create chore')
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chore'
      toast.error(errorMessage)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  // Removed assignment mutation - chore creation and assignment are now separate concerns

  const onSubmit = async (data: CreateChoreForm) => {
    setIsSubmitting(true)

    // Build the request object
    const request: CreateChoreRequest = {
      title: data.title,
      description: data.description || undefined,
      pointsReward: data.pointsReward,
      gamingTimeMinutes: data.gamingTimeMinutes,
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

    // Use the mutation instead of manual async handling
    createChoreMutation.mutate(request)
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

  if (!currentTenant) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Please select a family to create chores</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chore Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Clean your room"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Give your chore a clear, descriptive title
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Make your bed, organize your desk, and vacuum the floor"
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide detailed instructions for completing this chore
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficultyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
                          Easy
                        </div>
                      </SelectItem>
                      <SelectItem value={DifficultyLevel.MEDIUM}>
                        <div className="flex items-center gap-2">
                          {getDifficultyIcon(DifficultyLevel.MEDIUM)}
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value={DifficultyLevel.HARD}>
                        <div className="flex items-center gap-2">
                          {getDifficultyIcon(DifficultyLevel.HARD)}
                          Hard
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How challenging is this chore?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Rewards & Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Rewards & Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="pointsReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-points-primary" />
                      Points Reward
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
                    <FormDescription>
                      Points earned for completing this chore
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gamingTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4 text-primary" />
                      Gaming Time (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={480}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Gaming time earned for completion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimatedDurationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Estimated Duration (minutes)
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
                  <FormDescription>
                    How long should this chore take to complete?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Recurrence Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recurrence Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Recurring Chore
                    </FormLabel>
                    <FormDescription>
                      This chore repeats on a schedule
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
                      <FormLabel>Recurrence Pattern</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                              Daily
                            </div>
                          </SelectItem>
                          <SelectItem value="weekly">
                            <div className="flex items-center gap-2">
                              {getRecurrenceIcon('weekly')}
                              Weekly
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <div className="flex items-center gap-2">
                              {getRecurrenceIcon('monthly')}
                              Monthly
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
                        <FormLabel>Days of the Week</FormLabel>
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
                        <FormDescription>
                          Select which days of the week this chore should repeat
                        </FormDescription>
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
                        <FormLabel>Day of Month</FormLabel>
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
                        <FormDescription>
                          Which day of the month should this chore repeat? (1-31)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {form.watch('title') || 'Chore Title'}
                  </h3>
                  {form.watch('description') && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {form.watch('description')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {getDifficultyIcon(form.watch('difficultyLevel'))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-points-primary/10 text-points-primary">
                  {form.watch('pointsReward')} pts
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {form.watch('gamingTimeMinutes')}min gaming
                </Badge>
                <Badge variant="outline">
                  ~{form.watch('estimatedDurationMinutes')}min
                </Badge>
                {form.watch('isRecurring') && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    {form.watch('recurrenceType')}
                  </Badge>
                )}
              </div>

              {/* Assignment preview removed - assignments are now handled separately from chore creation */}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Chore'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
