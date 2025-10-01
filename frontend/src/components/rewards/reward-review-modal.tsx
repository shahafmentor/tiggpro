'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Loader2, CheckCircle, XCircle, Clock, FileText, ThumbsUp, ThumbsDown } from 'lucide-react'
import { rewardsApi } from '@/lib/api/rewards'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCommonTranslations, usePagesTranslations } from '@/hooks/use-translations'
import type { RewardRedemption } from '@tiggpro/shared'

interface RewardReviewModalProps {
  redemption: RewardRedemption | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReviewComplete?: () => void
}

export function RewardReviewModal({ redemption, open, onOpenChange, onReviewComplete }: RewardReviewModalProps) {
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const commonT = useCommonTranslations()
  const p = usePagesTranslations()
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null)
  const [reviewFeedback, setReviewFeedback] = useState('')

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant?.tenant?.id || !redemption) throw new Error('Missing context')
      return rewardsApi.approveRedemption(currentTenant.tenant.id, redemption.id)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(p('rewards.title'))
        queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', currentTenant?.tenant?.id] })
        setReviewFeedback('')
        setReviewDecision(null)
        onOpenChange(false)
        onReviewComplete?.()
      } else {
        toast.error(p('review.errorLoading'), { description: response.error })
      }
    },
    onError: (error) => {
      console.error('Reward review approve error:', error)
      toast.error(p('review.errorLoading'), { description: p('review.retry') })
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!currentTenant?.tenant?.id || !redemption) throw new Error('Missing context')
      return rewardsApi.rejectRedemption(currentTenant.tenant.id, redemption.id, reviewFeedback.trim() || undefined)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(p('rewards.title'))
        queryClient.invalidateQueries({ queryKey: ['rewards-redemptions', currentTenant?.tenant?.id] })
        setReviewFeedback('')
        setReviewDecision(null)
        onOpenChange(false)
        onReviewComplete?.()
      } else {
        toast.error(p('review.errorLoading'), { description: response.error })
      }
    },
    onError: (error) => {
      console.error('Reward review reject error:', error)
      toast.error(p('review.errorLoading'), { description: p('review.retry') })
    }
  })

  const handleReview = () => {
    if (!redemption || !reviewDecision) return
    if (reviewDecision === 'approve') {
      approveMutation.mutate()
    } else {
      rejectMutation.mutate()
    }
  }

  const handleCancel = () => {
    setReviewFeedback('')
    setReviewDecision(null)
    onOpenChange(false)
  }

  if (!redemption) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {p('rewards.title')}
          </DialogTitle>
          <DialogDescription>
            {p('rewards.reviewSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Redemption Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{p(`rewards.types.${redemption.type}`)}</Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(redemption.requestedAt).toLocaleString()}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {redemption.amount ? <div>{p('rewards.amountLabel')}: {redemption.amount}</div> : null}
                  {redemption.notes ? <div>{p('rewards.notesLabel')}: {redemption.notes}</div> : null}
                </div>
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
                    'flex-1 gap-2',
                    reviewDecision === 'approve' && 'bg-green-600 hover:bg-green-700'
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

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="reward-review-feedback">
                {p('review.feedbackLabel')} {reviewDecision === 'approve' ? p('review.optional') : p('review.required')}
              </Label>
              <Textarea
                id="reward-review-feedback"
                placeholder={reviewDecision === 'approve' ? p('review.feedbackApprove') : p('review.feedbackReject')}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                maxLength={500}
                rows={3}
                className={cn(
                  reviewDecision === 'reject' && !reviewFeedback.trim() && 'border-destructive focus-visible:ring-destructive'
                )}
              />
              <p className="text-xs text-muted-foreground">{reviewFeedback.length}/500 {p('review.characters')}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={approveMutation.isPending || rejectMutation.isPending}>
            {commonT('cancel')}
          </Button>
          <Button
            onClick={handleReview}
            disabled={
              approveMutation.isPending ||
              rejectMutation.isPending ||
              !reviewDecision ||
              (reviewDecision === 'reject' && !reviewFeedback.trim())
            }
            className={cn(
              reviewDecision === 'approve' && 'bg-green-600 hover:bg-green-700',
              reviewDecision === 'reject' && 'bg-destructive hover:bg-destructive/90'
            )}
          >
            {approveMutation.isPending || rejectMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {reviewDecision === 'approve' ? p('review.approving') : p('review.rejecting')}
              </>
            ) : (
              <>
                {reviewDecision === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                        {p('rewards.approveRequest')}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                        {p('rewards.rejectRequest')}
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


