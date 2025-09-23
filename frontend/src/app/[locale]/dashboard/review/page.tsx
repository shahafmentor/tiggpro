'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReviewSubmissionModal } from '@/components/chores/review-submission-modal'
import { assignmentsApi, type Submission } from '@/lib/api/assignments'
import { useTenant } from '@/lib/contexts/tenant-context'
import { TenantMemberRole } from '@tiggpro/shared'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { SubmissionCard } from '@/components/review/submission-card'
import { usePagesTranslations } from '@/hooks/use-translations'

export default function ReviewPage() {
  const { data: session } = useSession()
  const { currentTenant } = useTenant()
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null)
  const queryClient = useQueryClient()
  const p = usePagesTranslations()

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
                <h3 className="text-lg font-semibold">{p('review.accessRestricted')}</h3>
                <p className="text-sm text-muted-foreground">{p('review.onlyParentsAdmins')}</p>
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
                <h3 className="text-lg font-semibold">{p('review.errorLoading')}</h3>
                <p className="text-sm text-muted-foreground">{p('review.failedToLoad')}</p>
              </div>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['pending-submissions'] })}
                variant="outline"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                {p('review.retry')}
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
      <PageHeader
        title={p('review.title')}
        subtitle={p('review.subtitle')}
        badgeContent={p('review.pendingCount').replace('{count}', String(submissions.length))}
      />

      {/* Empty State */}
      {submissions.length === 0 && (
        <Card>
          <CardContent>
            <EmptyState
              icon={<CheckCircle className="h-12 w-12 text-muted-foreground" />}
              title={p('review.allCaughtUp')}
              description={p('review.noPending')}
            />
          </CardContent>
        </Card>
      )}

      {/* Submissions Grid */}
      {submissions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onReview={(s) => setReviewingSubmission(s)}
            />
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
