'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { isToday, getDayName, formatDate, isSameMonth } from '@/lib/date-utils'
import { getStatusDotColor } from '@/lib/status-utils'
import { AssignmentStatus } from '@tiggpro/shared'
import type { CalendarAssignment } from '@/lib/api/assignments'
import { CalendarAssignmentCard } from './calendar-assignment-card'

interface WeekDayCellProps {
  day: Date
  assignments: CalendarAssignment[]
  showAssignee?: boolean
  noChoresText?: string
  tMin?: string
  tPts?: string
}

export function WeekDayCell({
  day,
  assignments,
  showAssignee = false,
  noChoresText = 'No chores',
  tMin = 'min',
  tPts = 'pts',
}: WeekDayCellProps) {
  const today = isToday(day)
  const dateKey = formatDate(day)

  return (
    <Card
      key={dateKey}
      className={cn(
        'min-h-[160px] sm:min-h-[200px] flex flex-col',
        today && 'ring-2 ring-primary'
      )}
    >
      <CardHeader className="pb-1 pt-2 px-1 sm:px-3 sm:pt-3 sm:pb-2">
        <CardTitle
          className={cn(
            'text-xs sm:text-sm font-medium flex flex-col items-center gap-0.5 sm:gap-1',
            today && 'text-primary'
          )}
        >
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {getDayName(day, 'en', true)}
          </span>
          <span
            className={cn(
              'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base',
              today && 'bg-primary text-primary-foreground'
            )}
          >
            {day.getDate()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-1 sm:px-2 pb-1 sm:pb-2 overflow-y-auto">
        {assignments.length === 0 ? (
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-2 sm:py-4">
            {noChoresText}
          </p>
        ) : (
          <div className="space-y-1">
            {assignments.map((assignment) => (
              <CalendarAssignmentCard
                key={assignment.id}
                assignment={assignment}
                compact
                showAssignee={showAssignee}
                tMin={tMin}
                tPts={tPts}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MonthDayCellProps {
  day: Date
  currentMonth: Date
  assignments: CalendarAssignment[]
  isSelected?: boolean
  onSelect?: (day: Date | null) => void
}

export function MonthDayCell({
  day,
  currentMonth,
  assignments,
  isSelected = false,
  onSelect,
}: MonthDayCellProps) {
  const today = isToday(day)
  const isCurrentMonth = isSameMonth(day, currentMonth)
  const dateKey = formatDate(day)

  return (
    <button
      key={dateKey}
      onClick={() => onSelect?.(isSelected ? null : day)}
      className={cn(
        'relative h-12 sm:h-14 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5',
        'hover:bg-accent hover:border-accent-foreground/20',
        !isCurrentMonth && 'opacity-40',
        today && 'ring-2 ring-primary',
        isSelected && 'bg-accent border-primary'
      )}
    >
      <span
        className={cn(
          'text-sm sm:text-base font-medium',
          today && 'text-primary'
        )}
      >
        {day.getDate()}
      </span>

      {/* Status dots */}
      {assignments.length > 0 && (
        <div className="flex items-center gap-0.5">
          {assignments.slice(0, 3).map((assignment, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                getStatusDotColor(assignment.status as AssignmentStatus)
              )}
            />
          ))}
          {assignments.length > 3 && (
            <span className="text-[9px] text-muted-foreground">
              +{assignments.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  )
}
