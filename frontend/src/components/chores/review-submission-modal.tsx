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
import { useCommonTranslations, usePagesTranslations } from '@/hooks/use-translations'

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
  const commonT = useCommonTranslations()
  const p = usePagesTranslations()

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
        toast.success(p('review.title'), {
          description: reviewDecision === 'approve'
            ? p('review.allCaughtUp')
            : p('review.retry'),
        })

        // Reset form and close modal
        setReviewFeedback('')
        setReviewDecision(null)
        onOpenChange(false)
        onReviewComplete?.()
      } else {
        toast.error(p('review.errorLoading'), {
          description: response.error || p('review.failedToLoad'),
        })
      }
    },
    onError: (error) => {
      console.error('Review submission error:', error)
      toast.error(p('review.errorLoading'), {
        description: p('review.retry'),
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
            {p('review.title')}
          </DialogTitle>
          <DialogDescription>
            {p('review.subtitle')}
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
                      {assignee?.displayName || p('review.unknownUser')}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {p('review.due')} {assignment?.dueDate ?
                          new Date(assignment.dueDate).toLocaleDateString() :
                          p('review.noDueDate')
                        }
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        +{chore?.pointsReward || 0} {p('chores.subtitle')}
                      </div>
                      {chore?.gamingTimeMinutes && chore.gamingTimeMinutes > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          +{chore.gamingTimeMinutes} {p('review.minGaming')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {chore?.description && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{p('chores.title')}</p>
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
                    {p('review.submittedPrefix')} {new Date(submission.submittedAt).toLocaleString()}
                  </Badge>
                </div>

                {/* Submission Notes */}
                {submission.submissionNotes && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{p('review.notesLabel')}</p>
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
                      {p('review.photosCount')} ({submission.mediaUrls.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {submission.mediaUrls.map((url, index) => (
                        <div key={index} className="aspect-video bg-muted rounded-lg border overflow-hidden">
                          <img
                            src={url}
                            alt={`${p('review.submissionPhoto')} ${index + 1}`}
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
              <Label className="text-base font-medium">{p('review.reviewDecision')}</Label>
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
                  {p('review.approve')}
                </Button>
                <Button
                  variant={reviewDecision === 'reject' ? 'destructive' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setReviewDecision('reject')}
                >
                  <ThumbsDown className="h-4 w-4" />
                  {p('review.reject')}
                </Button>
              </div>
            </div>

            {/* Review Feedback */}
            <div className="space-y-2">
              <Label htmlFor="review-feedback">
                {p('review.feedbackLabel')} {reviewDecision === 'approve' ? p('review.optional') : p('review.required')}
              </Label>
              <Textarea
                id="review-feedback"
                placeholder={
                  reviewDecision === 'approve'
                    ? p('review.feedbackApprove')
                    : p('review.feedbackReject')
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
                {reviewFeedback.length}/500 {p('review.characters')}
              </p>
            </div>

            {/* Points Preview */}
            {reviewDecision === 'approve' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{p('review.pointsAwarded')}</span>
                </div>
                <div className="mt-1 text-sm text-green-700">
                  <div>• {chore?.pointsReward || 0} {p('review.pointsSuffix')}</div>
                  {chore?.gamingTimeMinutes && chore.gamingTimeMinutes > 0 && (
                    <div>• {chore.gamingTimeMinutes} {p('review.gamingTimeSuffix')}</div>
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
            {commonT('cancel')}
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
                {reviewDecision === 'approve' ? p('review.approving') : p('review.rejecting')}
              </>
            ) : (
              <>
                {reviewDecision === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {p('review.approveSubmission')}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    {p('review.rejectSubmission')}
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
