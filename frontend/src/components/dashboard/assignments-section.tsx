'use client'

import { useState } from 'react'
import { CheckSquare, Clock, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge, CountBadge, PointsBadge, DueDateBadge } from '@/components/ui/semantic-badges'
import { useDashboardTranslations } from '@/hooks/use-translations'
import type { Assignment } from '@/lib/api/assignments'

interface AssignmentsSectionProps {
  assignments: Assignment[]
  isLoading?: boolean
  error?: string | null
  isChild?: boolean
  onViewAssignment?: (assignment: Assignment) => void
  onSubmitAssignment?: (assignment: Assignment) => void
  showHeader?: boolean
}

export function AssignmentsSection({
  assignments,
  isLoading = false,
  error = null,
  isChild = false,
  onViewAssignment,
  onSubmitAssignment,
  showHeader = true
}: AssignmentsSectionProps) {
  const [showAllAssignments, setShowAllAssignments] = useState(false)
  const t = useDashboardTranslations()

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {t('myAssignments')}
            {assignments.length > 0 && (
              <CountBadge count={assignments.length} className="ml-auto" />
            )}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{t('failedToLoadAssignments')}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckSquare className="h-8 w-8 mx-auto mb-2" />
            <p>{t('noAssignments')}</p>
            <p className="text-sm">{t('checkBackLater')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllAssignments ? assignments : assignments.slice(0, 3)).map((assignment) => {
              const dueDate = new Date(assignment.dueDate)
              const isOverdue = dueDate < new Date() && assignment.status === 'pending'

              return (
                <div
                  key={assignment.id}
                  className={`p-3 rounded-lg border hover:bg-muted/50 transition-colors ${isChild ? 'cursor-pointer' : ''}`}
                  onClick={isChild ? () => onViewAssignment?.(assignment) : undefined}
                >
                  {/* Main row - icon, title, and action */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${assignment.status === 'approved' ? 'bg-chore-completed/10' :
                        assignment.status === 'submitted' ? 'bg-chore-submitted/10' :
                          isOverdue ? 'bg-chore-overdue/10' :
                            'bg-chore-pending/10'
                        }`}>
                        <CheckSquare className={`h-5 w-5 ${assignment.status === 'approved' ? 'text-chore-completed' :
                          assignment.status === 'submitted' ? 'text-chore-submitted' :
                            isOverdue ? 'text-chore-overdue' :
                              'text-chore-pending'
                          }`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {assignment.chore.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{t('due').replace('{date}', dueDate.toLocaleDateString())}</span>
                        </div>
                        <DueDateBadge dueDate={dueDate} />
                      </div>
                    </div>
                  </div>
                  {/* Footer row - points and action button */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <PointsBadge points={assignment.chore.pointsReward} />
                    {assignment.status === 'pending' ? (
                      <Button
                        size="sm"
                        className="text-xs h-7 px-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSubmitAssignment?.(assignment)
                        }}
                      >
                        {t('submit')}
                      </Button>
                    ) : assignment.status === 'rejected' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSubmitAssignment?.(assignment)
                        }}
                      >
                        {t('resubmit')}
                      </Button>
                    ) : (
                      <StatusBadge status={assignment.status} />
                    )}
                  </div>
                </div>
              )
            })}
            {assignments.length > 3 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAllAssignments(!showAllAssignments)}
              >
                {showAllAssignments ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    {t('showLess')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    {t('viewAllAssignments').replace('{count}', String(assignments.length))}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
