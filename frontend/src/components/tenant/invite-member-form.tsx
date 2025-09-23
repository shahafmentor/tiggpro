'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TenantMemberRole } from '@tiggpro/shared'
import { useCommonTranslations, useRolesTranslations } from '@/hooks/use-translations'
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
import { tenantsApi } from '@/lib/api/tenants'
import { toast } from 'sonner'

const inviteMemberSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  role: z.nativeEnum(TenantMemberRole),
  message: z
    .string()
    .max(500, 'Message must not exceed 500 characters')
    .optional(),
})

type InviteMemberForm = z.infer<typeof inviteMemberSchema>

interface InviteMemberFormProps {
  tenantId: string
  onSuccess?: () => void
}

export function InviteMemberForm({ tenantId, onSuccess }: InviteMemberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const commonT = useCommonTranslations()
  const rolesT = useRolesTranslations()

  const form = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: TenantMemberRole.CHILD,
      message: '',
    },
  })

  const inviteMemberMutation = useMutation({
    mutationFn: (data: InviteMemberForm) =>
      tenantsApi.inviteMember(tenantId, data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Invitation sent successfully!')
        queryClient.invalidateQueries({ queryKey: ['tenant-members'] })
        form.reset()
        onSuccess?.()
      } else {
        toast.error(response.error || 'Failed to send invitation')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitation')
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const onSubmit = async (data: InviteMemberForm) => {
    setIsSubmitting(true)
    inviteMemberMutation.mutate(data)
  }

  const getRoleDescription = (role: TenantMemberRole) => {
    switch (role) {
      case TenantMemberRole.ADMIN:
        return rolesT('adminDescription')
      case TenantMemberRole.PARENT:
        return rolesT('parentDescription')
      case TenantMemberRole.CHILD:
        return rolesT('childDescription')
      default:
        return ''
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{commonT('emailAddress')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                {commonT('emailInvitationHint')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{commonT('role')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={TenantMemberRole.ADMIN}>
                    👑 {rolesT('admin')}
                  </SelectItem>
                  <SelectItem value={TenantMemberRole.PARENT}>
                    🛡️ {rolesT('parent')}
                  </SelectItem>
                  <SelectItem value={TenantMemberRole.CHILD}>
                    👶 {rolesT('child')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {getRoleDescription(form.watch('role'))}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{commonT('personalMessage')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Welcome to our family! We're excited to have you join us in managing our chores together."
                  className="resize-none"
                  rows={3}
                  {...field}
                  disabled={isSubmitting}
                  maxLength={500}
                />
              </FormControl>
              <FormDescription>
                Add a personal touch to the invitation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">📧 What happens next:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• An invitation email will be sent to the recipient</li>
            <li>• They&apos;ll need to sign up or log in to accept</li>
            <li>• Once accepted, they&apos;ll appear in your family members list</li>
          </ul>
        </div>

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
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
