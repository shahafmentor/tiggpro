'use client'

import { Repeat } from 'lucide-react'

interface CalendarLegendProps {
  pendingLabel?: string
  submittedLabel?: string
  approvedLabel?: string
  overdueLabel?: string
  recurringLabel?: string
}

export function CalendarLegend({
  pendingLabel = 'Pending',
  submittedLabel = 'Submitted',
  approvedLabel = 'Approved',
  overdueLabel = 'Overdue',
  recurringLabel = 'Recurring',
}: CalendarLegendProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm pt-2">
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-500" />
        <span>{pendingLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-500" />
        <span>{submittedLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500" />
        <span>{approvedLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-500" />
        <span>{overdueLabel}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Repeat className="h-3 w-3" />
        <span>{recurringLabel}</span>
      </div>
    </div>
  )
}
