'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { tenantsApi } from '@/lib/api/tenants'
import { toast } from 'sonner'

const joinTenantSchema = z.object({
  tenantCode: z
    .string()
    .min(6, 'Tenant code must be at least 6 characters')
    .max(12, 'Tenant code must not exceed 12 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Tenant code can only contain letters and numbers'),
})

type JoinTenantForm = z.infer<typeof joinTenantSchema>

interface JoinTenantFormProps {
  onSuccess?: () => void
}

export function JoinTenantForm({ onSuccess }: JoinTenantFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<JoinTenantForm>({
    resolver: zodResolver(joinTenantSchema),
    defaultValues: {
      tenantCode: '',
    },
  })

  const joinTenantMutation = useMutation({
    mutationFn: tenantsApi.joinTenant,
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Successfully joined the family!')
        queryClient.invalidateQueries({ queryKey: ['tenants', 'my'] })
        form.reset()
        onSuccess?.()
      } else {
        toast.error(response.error || 'Failed to join family')
      }
    },
    onError: (error: unknown) => {
      toast.error((error as { error?: string }).error || 'Failed to join family')
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: JoinTenantForm) => {
    setIsSubmitting(true)
    joinTenantMutation.mutate(data)
  }

  const handleCodeInput = (value: string) => {
    // Auto-uppercase and clean the input
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tenantCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="ABC12345"
                  {...field}
                  onChange={(e) => {
                    const cleanValue = handleCodeInput(e.target.value)
                    field.onChange(cleanValue)
                  }}
                  className="font-mono text-lg tracking-wider text-center"
                  disabled={isSubmitting}
                  maxLength={12}
                />
              </FormControl>
              <FormDescription>
                Enter the family code provided by a family administrator
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">💡 How to get a family code:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Ask a family admin to share their code</li>
            <li>• Look for the code in the Family Management section</li>
            <li>• Family codes are 6-12 characters long</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Clear
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Joining...' : 'Join Family'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
