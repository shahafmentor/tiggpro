'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { tenantsApi, TenantMember } from '@/lib/api/tenants'
import { TenantMemberRole } from '@tiggpro/shared'
import { useRolesTranslations } from '@/hooks/use-translations'
import { toast } from 'sonner'

const roleChangeSchema = z.object({
    role: z.enum(Object.values(TenantMemberRole) as [string, ...string[]]),
})

type RoleChangeForm = z.infer<typeof roleChangeSchema>

interface RoleChangeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: TenantMember
    tenantId: string
    onSuccess?: () => void
}

export function RoleChangeDialog({
    open,
    onOpenChange,
    member,
    tenantId,
    onSuccess,
}: RoleChangeDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const queryClient = useQueryClient()
    const rolesT = useRolesTranslations()

    const form = useForm<RoleChangeForm>({
        resolver: zodResolver(roleChangeSchema),
        defaultValues: {
            role: member.role,
        },
    })

    const updateRoleMutation = useMutation({
        mutationFn: (data: RoleChangeForm) =>
            tenantsApi.updateMemberRole(tenantId, member.userId, data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success('Member role updated successfully!')
                queryClient.invalidateQueries({ queryKey: ['tenant-members'] })
                form.reset()
                onSuccess?.()
                onOpenChange(false)
            } else {
                toast.error(response.error || 'Failed to update member role')
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update member role')
        },
        onSettled: () => {
            setIsSubmitting(false)
        },
    })

    const onSubmit = async (data: RoleChangeForm) => {
        setIsSubmitting(true)
        updateRoleMutation.mutate(data)
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

    const getRoleDisplayName = (role: TenantMemberRole) => {
        switch (role) {
            case TenantMemberRole.ADMIN:
                return rolesT('admin')
            case TenantMemberRole.PARENT:
                return rolesT('parent')
            case TenantMemberRole.CHILD:
                return rolesT('child')
            default:
                return role
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Member Role</DialogTitle>
                    <DialogDescription>
                        Update the role for {member.user.displayName} in this family.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.values(TenantMemberRole).map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{getRoleDisplayName(role)}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {getRoleDescription(role)}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Role'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
