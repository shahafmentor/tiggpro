import { Badge, badgeVariants } from "./badge"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"
import { TenantMemberRole } from "@tiggpro/shared"
import { useRolesTranslations, useChoresTranslations } from "@/hooks/use-translations"

// Status Badge - for assignment/chore statuses
interface StatusBadgeProps extends React.ComponentProps<"span">,
  Omit<VariantProps<typeof badgeVariants>, 'variant'> {
  status: 'pending' | 'submitted' | 'approved' | 'completed' | 'rejected' | 'overdue'
  asChild?: boolean
}

export function StatusBadge({ status, className, asChild, ...props }: StatusBadgeProps) {
  const choresT = useChoresTranslations()

  const getStatusVariant = (status: StatusBadgeProps['status']) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'success'
      case 'submitted':
        return 'warning'
      case 'rejected':
      case 'overdue':
        return 'error'
      case 'pending':
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: StatusBadgeProps['status']) => {
    switch (status) {
      case 'approved':
        return choresT('approved')
      case 'completed':
        return choresT('done')
      case 'submitted':
        return choresT('submitted')
      case 'rejected':
        return choresT('rejected')
      case 'overdue':
        return choresT('overdue')
      case 'pending':
        return choresT('pending')
      default:
        return status
    }
  }

  return (
    <Badge
      variant={getStatusVariant(status) as 'success' | 'warning' | 'error' | 'secondary'}
      className={className}
      asChild={asChild}
      {...props}
    >
      {getStatusText(status)}
    </Badge>
  )
}

// Count Badge - for displaying numbers (assignment counts, etc.)
interface CountBadgeProps extends React.ComponentProps<"span">,
  Omit<VariantProps<typeof badgeVariants>, 'variant'> {
  count: number
  asChild?: boolean
}

export function CountBadge({ count, className, asChild, ...props }: CountBadgeProps) {
  return (
    <Badge
      variant="count"
      className={className}
      asChild={asChild}
      {...props}
    >
      {count}
    </Badge>
  )
}

// Points Badge - for displaying point values
interface PointsBadgeProps extends React.ComponentProps<"span">,
  Omit<VariantProps<typeof badgeVariants>, 'variant'> {
  points: number
  showPlus?: boolean
  asChild?: boolean
}

export function PointsBadge({ points, showPlus = true, className, asChild, ...props }: PointsBadgeProps) {
  const choresT = useChoresTranslations()

  return (
    <Badge
      variant="points"
      className={className}
      asChild={asChild}
      {...props}
    >
      {showPlus && points > 0 ? `+${points}` : points} {choresT('pts')}
    </Badge>
  )
}

// Priority Badge - for displaying task priorities
interface PriorityBadgeProps extends React.ComponentProps<"span">,
  Omit<VariantProps<typeof badgeVariants>, 'variant'> {
  priority: 'low' | 'medium' | 'high'
  asChild?: boolean
}

export function PriorityBadge({ priority, className, asChild, ...props }: PriorityBadgeProps) {
  const getPriorityVariant = (priority: PriorityBadgeProps['priority']) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
      default:
        return 'secondary'
    }
  }

  return (
    <Badge
      variant={getPriorityVariant(priority) as 'error' | 'warning' | 'secondary'}
      className={className}
      asChild={asChild}
      {...props}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

// Due Date Badge - for showing due date status
interface DueDateBadgeProps extends React.ComponentProps<"span">,
  Omit<VariantProps<typeof badgeVariants>, 'variant'> {
  dueDate: Date
  currentDate?: Date
  asChild?: boolean
}

export function DueDateBadge({ dueDate, currentDate = new Date(), className, asChild, ...props }: DueDateBadgeProps) {
  const choresT = useChoresTranslations()
  const now = currentDate.getTime()
  const due = dueDate.getTime()
  const timeDiff = due - now
  const hoursUntilDue = timeDiff / (1000 * 60 * 60)
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  const getVariantAndText = () => {
    if (timeDiff < 0) {
      return { variant: 'error', text: choresT('overdue') }
    }
    if (hoursUntilDue <= 24) {
      return { variant: 'warning', text: choresT('dueSoon') }
    }
    if (daysDiff <= 3) {
      const plural = daysDiff === 1 ? '' : 's'
      return { variant: 'secondary', text: choresT('dueInDays').replace('{days}', daysDiff.toString()).replace('{plural}', plural) }
    }
    return null // Don't show badge if not urgent
  }

  const result = getVariantAndText()
  if (!result) return null

  return (
    <Badge
      variant={result.variant as 'error' | 'warning' | 'secondary'}
      className={cn("text-xs py-0 px-1", className)}
      asChild={asChild}
      {...props}
    >
      {result.text}
    </Badge>
  )
}

// Role Badge - for displaying user roles
interface RoleBadgeProps extends React.ComponentProps<"span">,
  Omit<VariantProps<typeof badgeVariants>, 'variant'> {
  role: TenantMemberRole
  asChild?: boolean
}

export function RoleBadge({ role, className, asChild, ...props }: RoleBadgeProps) {
  const rolesT = useRolesTranslations()

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

  const getRoleVariantAndClass = (role: TenantMemberRole) => {
    switch (role) {
      case TenantMemberRole.ADMIN:
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
        }
      case TenantMemberRole.PARENT:
        return {
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
        }
      case TenantMemberRole.CHILD:
        return {
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
        }
      default:
        return {
          variant: 'secondary' as const,
          className: ''
        }
    }
  }

  const { variant, className: roleClassName } = getRoleVariantAndClass(role)

  return (
    <Badge
      variant={variant}
      className={cn("text-xs", roleClassName, className)}
      asChild={asChild}
      {...props}
    >
      {getRoleDisplayName(role)}
    </Badge>
  )
}