'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/semantic-badges'
import { Calendar, Star, User, Eye } from 'lucide-react'
import type { Submission } from '@/lib/api/assignments'
import { usePagesTranslations } from '@/hooks/use-translations'

interface SubmissionCardProps {
  submission: Submission
  onReview: (submission: Submission) => void
}

export function SubmissionCard({ submission, onReview }: SubmissionCardProps) {
  const pageT = usePagesTranslations()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg line-clamp-2">
              {submission.assignment?.chore?.title || pageT('review.unknownChore')}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{submission.assignment?.assignedTo?.displayName || pageT('review.unknownUser')}</span>
            </div>
          </div>
          <StatusBadge status="pending" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{pageT('review.due')} {submission.assignment?.dueDate ?
              new Date(submission.assignment.dueDate).toLocaleDateString() :
              pageT('review.noDueDate')
            }</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span>+{submission.assignment?.chore?.pointsReward || 0} points</span>
          </div>
        </div>

        {submission.submissionNotes && (
          <div className="space-y-1">
            <p className="text-sm font-medium">{pageT('review.notes')}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {submission.submissionNotes}
            </p>
          </div>
        )}

        {submission.mediaUrls && submission.mediaUrls.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">{pageT('review.photos')} {submission.mediaUrls.length}</p>
            <div className="flex gap-1">
              {submission.mediaUrls.slice(0, 3).map((url, index) => (
                <div key={index} className="w-12 h-12 bg-muted rounded border overflow-hidden">
                  <img
                    src={url}
                    alt={`${pageT('review.submissionPhoto')} ${index + 1}`}
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

        <div className="text-xs text-muted-foreground">
          {pageT('review.submitted')} {new Date(submission.submittedAt).toLocaleString()}
        </div>

        <Button className="w-full" onClick={() => onReview(submission)}>
          <Eye className="h-4 w-4 mr-2" />
          {pageT('review.reviewSubmission')}
        </Button>
      </CardContent>
    </Card>
  )
}


