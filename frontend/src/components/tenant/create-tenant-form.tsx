'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TenantType } from '@tiggpro/shared'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { tenantsApi } from '@/lib/api/tenants'
import { toast } from 'sonner'

const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, 'Family name must be at least 2 characters')
    .max(50, 'Family name must not exceed 50 characters'),
  type: z.nativeEnum(TenantType),
})

type CreateTenantForm = z.infer<typeof createTenantSchema>

interface CreateTenantFormProps {
  onSuccess?: () => void
}

export function CreateTenantForm({ onSuccess }: CreateTenantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      type: TenantType.FAMILY,
    },
  })

  const createTenantMutation = useMutation({
    mutationFn: tenantsApi.createTenant,
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Family created successfully!')
        queryClient.invalidateQueries({ queryKey: ['tenants'] })
        form.reset()
        onSuccess?.()
      } else {
        toast.error(response.error || 'Failed to create family')
      }
    },
    onError: (error: any) => {
      toast.error(error.error || 'Failed to create family')
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: CreateTenantForm) => {
    setIsSubmitting(true)
    createTenantMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="The Smith Family"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Choose a name that represents your family or organization
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select family type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TenantType.FAMILY}>
                    👨‍👩‍👧‍👦 Family
                  </SelectItem>
                  {/* Future tenant types can be added here */}
                </SelectContent>
              </Select>
              <FormDescription>
                Currently, only family management is supported
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
            {isSubmitting ? 'Creating...' : 'Create Family'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
