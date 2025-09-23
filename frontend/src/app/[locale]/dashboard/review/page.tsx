'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  CheckCircle,
  Clock,
  User,
  Calendar,
  Star,
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewSubmissionModal } from '@/components/chores/review-submission-modal'
import { assignmentsApi, type Submission } from '@/lib/api/assignments'
import { useTenant } from '@/lib/contexts/tenant-context'
import { TenantMemberRole } from '@tiggpro/shared'

export default function ReviewPage() {
  const { data: session } = useSession()
  const { currentTenant } = useTenant()
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null)
  const queryClient = useQueryClient()

  // Check if user has permission to review submissions
  const canReview = currentTenant?.role === TenantMemberRole.ADMIN ||
                   currentTenant?.role === TenantMemberRole.PARENT

  // Fetch pending submissions for review
  const { data: submissionsResponse, isLoading, error } = useQuery({
    queryKey: ['pending-submissions', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? assignmentsApi.getPendingSubmissions(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session && canReview,
    refetchInterval: 30000, // Refetch every 30 seconds to keep data fresh
  })

  const submissions: Submission[] = submissionsResponse?.success ? submissionsResponse.data || [] : []

  // Redirect if user doesn't have permission
  if (!canReview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Access Restricted</h3>
                <p className="text-sm text-muted-foreground">
                  Only parents and admins can review submissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Error Loading Submissions</h3>
                <p className="text-sm text-muted-foreground">
                  Failed to load pending submissions. Please try again.
                </p>
              </div>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })}
                variant="outline"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleReviewComplete = () => {
    // Refresh the submissions list
    queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })
    queryClient.invalidateQueries({ queryKey: ['assignments'] })
    queryClient.invalidateQueries({ queryKey: ['chores'] })
    setReviewingSubmission(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Submissions</h1>
          <p className="text-muted-foreground">
            Review and approve children&apos;s completed chores
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {submissions.length} pending
        </Badge>
      </div>

      {/* Empty State */}
      {submissions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground">
                  No submissions are currently pending review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Grid */}
      {submissions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {submission.assignment?.chore?.title || 'Unknown Chore'}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{submission.assignment?.assignedTo?.displayName || 'Unknown User'}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Assignment Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due: {submission.assignment?.dueDate ?
                      new Date(submission.assignment.dueDate).toLocaleDateString() :
                      'No due date'
                    }</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span>+{submission.assignment?.chore?.pointsReward || 0} points</span>
                  </div>
                </div>

                {/* Submission Notes Preview */}
                {submission.submissionNotes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {submission.submissionNotes}
                    </p>
                  </div>
                )}

                {/* Media Preview */}
                {submission.mediaUrls && submission.mediaUrls.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Photos: {submission.mediaUrls.length}</p>
                    <div className="flex gap-1">
                      {submission.mediaUrls.slice(0, 3).map((url, index) => (
                        <div key={index} className="w-12 h-12 bg-muted rounded border overflow-hidden">
                          <img
                            src={url}
                            alt={`Submission photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {submission.mediaUrls.length > 3 && (
                        <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            +{submission.mediaUrls.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submission Time */}
                <div className="text-xs text-muted-foreground">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </div>

                {/* Review Button */}
                <Button
                  className="w-full"
                  onClick={() => setReviewingSubmission(submission)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review Submission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <ReviewSubmissionModal
        submission={reviewingSubmission}
        open={!!reviewingSubmission}
        onOpenChange={(open) => !open && setReviewingSubmission(null)}
        onReviewComplete={handleReviewComplete}
      />
    </div>
  )
}
