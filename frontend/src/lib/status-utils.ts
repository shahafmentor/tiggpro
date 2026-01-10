/**
 * Status utility functions for consistent styling across components
 */

import { AssignmentStatus } from '@tiggpro/shared'

// Get status background and text color classes
export function getStatusColor(status: AssignmentStatus): string {
  switch (status) {
    case AssignmentStatus.APPROVED:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case AssignmentStatus.SUBMITTED:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case AssignmentStatus.REJECTED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case AssignmentStatus.OVERDUE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
}

// Get status dot color for compact views
export function getStatusDotColor(status: AssignmentStatus): string {
  switch (status) {
    case AssignmentStatus.APPROVED:
      return 'bg-green-500'
    case AssignmentStatus.SUBMITTED:
      return 'bg-yellow-500'
    case AssignmentStatus.REJECTED:
    case AssignmentStatus.OVERDUE:
      return 'bg-red-500'
    default:
      return 'bg-blue-500'
  }
}

// Get status badge variant for UI components
export function getStatusBadgeVariant(status: AssignmentStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case AssignmentStatus.APPROVED:
      return 'default'
    case AssignmentStatus.SUBMITTED:
      return 'secondary'
    case AssignmentStatus.REJECTED:
    case AssignmentStatus.OVERDUE:
      return 'destructive'
    default:
      return 'outline'
  }
}
