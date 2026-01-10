'use client'

import { Assignment } from '@/lib/api/assignments'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Star, CheckSquare, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import { StatusBadge, PointsBadge, DueDateBadge } from '@/components/ui/semantic-badges'
import { useChoresTranslations, usePagesTranslations } from '@/hooks/use-translations'

interface ChoreDetailModalProps {
  assignment: Assignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (assignment: Assignment) => void
  canSubmit?: boolean
}

export function ChoreDetailModal({
  assignment,
  open,
  onOpenChange,
  onSubmit,
  canSubmit = false
}: ChoreDetailModalProps) {
  const choresT = useChoresTranslations()
  const p = usePagesTranslations()
  if (!assignment) return null

  // Get the latest submission (most recent one)
  const latestSubmission = assignment.submissions?.length
    ? assignment.submissions[0]
    : null

  const dueDate = new Date(assignment.dueDate)
  const isOverdue = dueDate < new Date() && assignment.status === 'pending'

  const getDifficultyLevel = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return { stars: 1, color: 'text-green-500' }
      case 'medium':
        return { stars: 2, color: 'text-yellow-500' }
      case 'hard':
        return { stars: 3, color: 'text-red-500' }
      default:
        return { stars: 1, color: 'text-gray-500' }
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return choresT('easy')
      case 'medium':
        return choresT('medium')
      case 'hard':
        return choresT('hard')
      default:
        return difficulty
    }
  }

  const difficultyInfo = getDifficultyLevel(assignment.chore.difficultyLevel)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {assignment.chore.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Due Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={assignment.status} />
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  {choresT('overdue')}
                </Badge>
              )}
            </div>
            <DueDateBadge dueDate={dueDate} />
          </div>

          <div className="border-t border-border" />

          {/* Description */}
          {assignment.chore.description && (
            <div>
              <h4 className="font-medium text-sm mb-2">{choresT('description')}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {assignment.chore.description}
              </p>
            </div>
          )}

          {/* Chore Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">{choresT('basicInfo')}</h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Points Reward */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{choresT('points')}</p>
                  <PointsBadge points={assignment.chore.pointsReward} showPlus={false} />
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Star className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{choresT('difficulty')}</p>
                  <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < difficultyInfo.stars
                            ? `${difficultyInfo.color} fill-current`
                            : 'text-gray-300 dark:text-gray-600'
                          }`}
                      />
                    ))}
                    <span className="text-xs ml-1">{getDifficultyText(assignment.chore.difficultyLevel)}</span>
                  </div>
                </div>
              </div>

              {/* Estimated Duration */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{choresT('duration')}</p>
                  <p className="text-sm font-medium">~{assignment.chore.estimatedDurationMinutes} {choresT('min')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date Details */}
          <div>
            <h4 className="font-medium text-sm mb-2">{choresT('dueDate')}</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          {/* Review Information (for approved/rejected assignments) */}
          {latestSubmission && (assignment.status === 'approved' || assignment.status === 'rejected') && (
            <>
              <div className="border-t border-border" />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">{p('chores.reviewInfo')}</h4>

                {/* Status message */}
                {assignment.status === 'approved' && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {p('chores.approvedMessage')}
                        </p>
                        {latestSubmission.pointsAwarded && (
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            +{latestSubmission.pointsAwarded} {choresT('pts')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {assignment.status === 'rejected' && (
                  <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          {p('chores.rejectedMessage')}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {p('chores.rejectedDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviewer info */}
                {latestSubmission.reviewer && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {assignment.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>{p('chores.reviewedByLabel')}:</span>
                    <span className="font-medium">{latestSubmission.reviewer.displayName}</span>
                  </div>
                )}

                {/* Review date */}
                {latestSubmission.reviewedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{p('chores.reviewedAtLabel')}:</span>
                    <span>{new Date(latestSubmission.reviewedAt).toLocaleString()}</span>
                  </div>
                )}

                {/* Feedback */}
                {latestSubmission.reviewFeedback && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span>{p('chores.feedbackLabel')}:</span>
                    </div>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {latestSubmission.reviewFeedback}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit Button for Kids */}
          {canSubmit && assignment.status === 'pending' && onSubmit && (
            <>
              <div className="border-t border-border" />
              <div className="flex justify-end">
                <Button
                  onClick={() => onSubmit(assignment)}
                  className="w-full sm:w-auto"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {choresT('submit')}
                </Button>
              </div>
            </>
          )}

          {canSubmit && assignment.status === 'rejected' && onSubmit && (
            <>
              <div className="border-t border-border" />
              <div className="flex justify-end">
                <Button
                  onClick={() => onSubmit(assignment)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {choresT('submit')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}