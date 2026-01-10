'use client'

import { Repeat, Clock, Star } from 'lucide-react'
import { AssignmentStatus } from '@tiggpro/shared'
import { cn } from '@/lib/utils'
import { getStatusColor } from '@/lib/status-utils'
import type { CalendarAssignment } from '@/lib/api/assignments'

interface CalendarAssignmentCardProps {
  assignment: CalendarAssignment
  compact?: boolean
  showAssignee?: boolean
  tMin?: string
  tPts?: string
}

function getPriorityIndicator(priority: string): React.ReactNode {
  if (priority === 'high') {
    return <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
  }
  return null
}

export function CalendarAssignmentCard({
  assignment,
  compact = false,
  showAssignee = false,
  tMin = 'min',
  tPts = 'pts',
}: CalendarAssignmentCardProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'p-1 sm:p-2 rounded-md text-[10px] sm:text-xs cursor-pointer hover:opacity-80 transition-opacity',
          getStatusColor(assignment.status as AssignmentStatus)
        )}
      >
        <div className="flex items-start gap-0.5 sm:gap-1">
          {assignment.chore.isRecurring && (
            <Repeat className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 mt-0.5" />
          )}
          {getPriorityIndicator(assignment.priority)}
          <span className="font-medium truncate flex-1 leading-tight">
            {assignment.chore.title}
          </span>
        </div>
        {assignment.assignedTo && showAssignee && (
          <div className="text-[9px] sm:text-[10px] opacity-75 mt-0.5 truncate">
            {assignment.assignedTo.displayName}
          </div>
        )}
        <div className="hidden sm:flex items-center gap-1 mt-1 text-[10px] opacity-75">
          <Clock className="h-2.5 w-2.5" />
          <span>{assignment.chore.estimatedDurationMinutes} {tMin}</span>
          <span>•</span>
          <span>{assignment.chore.pointsReward} {tPts}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity',
        getStatusColor(assignment.status as AssignmentStatus)
      )}
    >
      <div className="flex items-start gap-2">
        {assignment.chore.isRecurring && (
          <Repeat className="h-4 w-4 flex-shrink-0 mt-0.5" />
        )}
        {getPriorityIndicator(assignment.priority)}
        <div className="flex-1 min-w-0">
          <span className="font-medium block truncate">
            {assignment.chore.title}
          </span>
          {assignment.assignedTo && showAssignee && (
            <div className="text-xs opacity-75 mt-0.5">
              {assignment.assignedTo.displayName}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{assignment.chore.estimatedDurationMinutes} {tMin}</span>
        </div>
        <span>•</span>
        <span>{assignment.chore.pointsReward} {tPts}</span>
      </div>
    </div>
  )
}
