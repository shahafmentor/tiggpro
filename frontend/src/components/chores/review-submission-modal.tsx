'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  CheckCircle,
  XCircle,
  Calendar,
  Star,
  Clock,
  FileText,
  Image,
  Loader2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { assignmentsApi, type Submission, type ReviewSubmissionRequest } from '@/lib/api/assignments'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewSubmissionModalProps {
  submission: Submission | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReviewComplete?: () => void
}

export function ReviewSubmissionModal({
  submission,
  open,
  onOpenChange,
  onReviewComplete,
}: ReviewSubmissionModalProps) {
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null)
  const { currentTenant } = useTenant()

  const reviewMutation = useMutation({
    mutationFn: async (request: ReviewSubmissionRequest) => {
      if (!submission || !currentTenant?.tenant) {
        throw new Error('Submission or tenant not found')
      }
      return assignmentsApi.reviewSubmission(currentTenant.tenant.id, submission.id, request)
    },
    onSuccess: (response) => {
      if (response.success) {
        const action = reviewDecision === 'approve' ? 'approved' : 'rejected'
        toast.success(`Submission ${action} successfully!`, {
          description: reviewDecision === 'approve'
            ? 'Points and gaming time have been awarded.'
            : 'Feedback has been provided to the child.',
        })

        // Reset form and close modal
        setReviewFeedback('')
        setReviewDecision(null)
        onOpenChange(false)
        onReviewComplete?.()
      } else {
        toast.error('Failed to review submission', {
          description: response.error || 'Please try again later.',
        })
      }
    },
    onError: (error) => {
      console.error('Review submission error:', error)
      toast.error('Failed to review submission', {
        description: 'Please check your connection and try again.',
      })
    },
  })

  const handleReview = () => {
    if (!submission || !reviewDecision) return

    const request: ReviewSubmissionRequest = {
      reviewStatus: reviewDecision === 'approve' ? 'approved' : 'rejected',
      reviewFeedback: reviewFeedback.trim() || undefined,
      pointsAwarded: reviewDecision === 'approve' ? submission.assignment?.chore?.pointsReward : 0,
      gamingTimeAwarded: reviewDecision === 'approve' ? submission.assignment?.chore?.gamingTimeMinutes : 0,
    }

    reviewMutation.mutate(request)
  }

  const handleCancel = () => {
    setReviewFeedback('')
    setReviewDecision(null)
    onOpenChange(false)
  }

  if (!submission) return null

  const assignment = submission.assignment
  const chore = assignment?.chore
  const assignee = assignment?.assignedTo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review Submission
          </DialogTitle>
          <DialogDescription>
            Review this chore completion and decide whether to approve or reject it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment & Chore Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={assignee?.avatarUrl} />
                    <AvatarFallback>
                      {assignee?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-foreground">{chore?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Assigned to {assignee?.displayName || 'Unknown User'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {assignment?.dueDate ?
                          new Date(assignment.dueDate).toLocaleDateString() :
                          'No due date'
                        }
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        +{chore?.pointsReward || 0} points
                      </div>
                      {chore?.gamingTimeMinutes && chore.gamingTimeMinutes > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          +{chore.gamingTimeMinutes} min gaming
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {chore?.description && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Chore Description:</p>
                    <p className="text-sm text-muted-foreground">{chore.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submission Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Submitted {new Date(submission.submittedAt).toLocaleString()}
                  </Badge>
                </div>

                {/* Submission Notes */}
                {submission.submissionNotes && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Child&apos;s Notes:</p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{submission.submissionNotes}</p>
                    </div>
                  </div>
                )}

                {/* Media Gallery */}
                {submission.mediaUrls && submission.mediaUrls.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Photos ({submission.mediaUrls.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {submission.mediaUrls.map((url, index) => (
                        <div key={index} className="aspect-video bg-muted rounded-lg border overflow-hidden">
                          <img
                            src={url}
                            alt={`Submission photo ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(url, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review Decision */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Review Decision</Label>
              <div className="flex gap-3">
                <Button
                  variant={reviewDecision === 'approve' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 gap-2",
                    reviewDecision === 'approve' && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={() => setReviewDecision('approve')}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant={reviewDecision === 'reject' ? 'destructive' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setReviewDecision('reject')}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>

            {/* Review Feedback */}
            <div className="space-y-2">
              <Label htmlFor="review-feedback">
                Feedback {reviewDecision === 'approve' ? '(Optional)' : '(Required)'}
              </Label>
              <Textarea
                id="review-feedback"
                placeholder={
                  reviewDecision === 'approve'
                    ? "Great job! (optional feedback)"
                    : "Please explain what needs to be improved..."
                }
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                maxLength={500}
                rows={3}
                className={cn(
                  reviewDecision === 'reject' && !reviewFeedback.trim() &&
                  "border-destructive focus-visible:ring-destructive"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {reviewFeedback.length}/500 characters
              </p>
            </div>

            {/* Points Preview */}
            {reviewDecision === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Points to be awarded:</span>
                </div>
                <div className="mt-1 text-sm text-green-700">
                  <div>• {chore?.pointsReward || 0} points</div>
                  {chore?.gamingTimeMinutes && chore.gamingTimeMinutes > 0 && (
                    <div>• {chore.gamingTimeMinutes} minutes of gaming time</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={reviewMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReview}
            disabled={
              reviewMutation.isPending ||
              !reviewDecision ||
              (reviewDecision === 'reject' && !reviewFeedback.trim())
            }
            className={cn(
              reviewDecision === 'approve' && "bg-green-600 hover:bg-green-700",
              reviewDecision === 'reject' && "bg-destructive hover:bg-destructive/90"
            )}
          >
            {reviewMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {reviewDecision === 'approve' ? 'Approving...' : 'Rejecting...'}
              </>
            ) : (
              <>
                {reviewDecision === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Submission
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Submission
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
