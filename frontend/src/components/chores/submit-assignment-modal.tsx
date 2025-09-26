'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, FileText, Loader2, Upload, X } from 'lucide-react'
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
import { assignmentsApi, type Assignment, type SubmitAssignmentRequest } from '@/lib/api/assignments'
import { useTenant } from '@/lib/contexts/tenant-context'
import { toast } from 'sonner'
import { useCommonTranslations, useModalsTranslations } from '@/hooks/use-translations'

interface SubmitAssignmentModalProps {
  assignment: Assignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmitAssignmentModal({
  assignment,
  open,
  onOpenChange,
}: SubmitAssignmentModalProps) {
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()
  const commonT = useCommonTranslations()
  const m = useModalsTranslations()

  const submitMutation = useMutation({
    mutationFn: async (request: SubmitAssignmentRequest) => {
      if (!assignment || !currentTenant?.tenant) {
        throw new Error('Assignment or tenant not found')
      }
      return assignmentsApi.submitAssignment(currentTenant.tenant.id, assignment.id, request)
    },
    onSuccess: (response) => {
      if (response.success) {
        toast.success(m('submitAssignment.successTitle'), {
          description: m('submitAssignment.successDesc'),
        })
        // Invalidate relevant queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['user-assignments'] })
        queryClient.invalidateQueries({ queryKey: ['assignments'] })
        queryClient.invalidateQueries({ queryKey: ['chores'] })

        // Reset form and close modal
        setSubmissionNotes('')
        setMediaUrls([])
        onOpenChange(false)
      } else {
        toast.error(m('submitAssignment.failTitle'), {
          description: response.error || m('submitAssignment.failDesc'),
        })
      }
    },
    onError: (error) => {
      console.error('Submit assignment error:', error)
      toast.error(m('submitAssignment.failTitle'), {
        description: m('submitAssignment.networkDesc'),
      })
    },
  })

  const handleSubmit = () => {
    if (!assignment) return

    const request: SubmitAssignmentRequest = {
      submissionNotes: submissionNotes.trim() || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    }

    submitMutation.mutate(request)
  }

  const handleCancel = () => {
    setSubmissionNotes('')
    setMediaUrls([])
    onOpenChange(false)
  }

  // Basic photo upload functionality
  const handleAddPhoto = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) {
        // For MVP, we'll just store the file names as URLs
        // In a real implementation, you'd upload to a service like Cloudinary
        const newUrls = Array.from(files).map(file => {
          // Create a local URL for preview
          return URL.createObjectURL(file)
        })
        setMediaUrls(prev => [...prev, ...newUrls])
      }
    }
    input.click()
  }

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index))
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {m('submitAssignment.title')}
          </DialogTitle>
          <DialogDescription>
            {m('submitAssignment.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignment Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">{assignment.chore.title}</h4>
                {assignment.chore.description && (
                  <p className="text-sm text-muted-foreground">
                    {assignment.chore.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {m('submitAssignment.pointsPlus').replace('{points}', String(assignment.chore.pointsReward))}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Notes */}
          <div className="space-y-2">
            <Label htmlFor="submission-notes">{m('submitAssignment.notesLabel')}</Label>
            <Textarea
              id="submission-notes"
              placeholder={m('submitAssignment.notesPlaceholder')}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {m('submitAssignment.chars').replace('{count}', String(submissionNotes.length))}
            </p>
          </div>

          {/* Media Upload Section */}
          <div className="space-y-2">
            <Label>{m('submitAssignment.photosVideos')}</Label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddPhoto}
              >
                <Camera className="h-4 w-4 mr-2" />
                {m('submitAssignment.addPhoto')}
              </Button>

              {mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-video bg-muted rounded border overflow-hidden">
                        <img
                          src={url}
                          alt={`Submission photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{m('submitAssignment.hintPhotos')}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitMutation.isPending}
          >
            {commonT('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {m('submitAssignment.submitting')}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {m('submitAssignment.submit')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}