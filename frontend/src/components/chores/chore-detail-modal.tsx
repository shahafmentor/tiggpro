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
import { Clock, Star, Gamepad, CheckSquare } from 'lucide-react'
import { StatusBadge, PointsBadge, DueDateBadge } from '@/components/ui/semantic-badges'

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
  if (!assignment) return null

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
              <StatusBadge status={assignment.status as 'pending' | 'submitted' | 'approved' | 'completed' | 'rejected' | 'overdue'} />
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
            <DueDateBadge dueDate={dueDate} />
          </div>

          <div className="border-t border-border" />

          {/* Description */}
          {assignment.chore.description && (
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {assignment.chore.description}
              </p>
            </div>
          )}

          {/* Chore Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Chore Details</h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Points Reward */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Points</p>
                  <PointsBadge points={assignment.chore.pointsReward} showPlus={false} />
                </div>
              </div>

              {/* Gaming Time */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Gamepad className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gaming Time</p>
                  <p className="text-sm font-medium">{assignment.chore.gamingTimeMinutes} min</p>
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Star className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < difficultyInfo.stars
                            ? `${difficultyInfo.color} fill-current`
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                    <span className="text-xs ml-1 capitalize">{assignment.chore.difficultyLevel}</span>
                  </div>
                </div>
              </div>

              {/* Estimated Duration */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">~{assignment.chore.estimatedDurationMinutes} min</p>
                </div>
              </div>
            </div>
          </div>

          {/* Due Date Details */}
          <div>
            <h4 className="font-medium text-sm mb-2">Due Date</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

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
                  Submit Chore
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
                  Resubmit Chore
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}