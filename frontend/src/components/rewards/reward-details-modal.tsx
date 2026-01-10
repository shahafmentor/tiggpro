'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Gift, CheckCircle, XCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCommonTranslations, usePagesTranslations } from '@/hooks/use-translations'
import type { RewardRedemption, RedemptionStatus } from '@tiggpro/shared'

interface RewardDetailsModalProps {
  redemption: RewardRedemption | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestAgain?: (redemption: RewardRedemption) => void
}

export function RewardDetailsModal({
  redemption,
  open,
  onOpenChange,
  onRequestAgain
}: RewardDetailsModalProps) {
  const commonT = useCommonTranslations()
  const p = usePagesTranslations()

  if (!redemption) return null

  const getStatusIcon = (status: RedemptionStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: RedemptionStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
  }

  const handleRequestAgain = () => {
    if (onRequestAgain && redemption) {
      onRequestAgain(redemption)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {p('rewards.rewardDetails')}
          </DialogTitle>
          <DialogDescription>
            {p('rewards.rewardDetailsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reward Type */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Type and Status */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {p(`rewards.types.${redemption.type}`)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('flex items-center gap-1.5', getStatusColor(redemption.status))}
                  >
                    {getStatusIcon(redemption.status)}
                    {p(`rewards.status.${redemption.status}`)}
                  </Badge>
                </div>

                {/* Amount (if applicable) */}
                {redemption.amount && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{p('rewards.amountLabel')}:</span>
                    <span className="font-medium">
                      {redemption.amount} {redemption.type === 'spending_money' ? p('rewards.currency') : p('rewards.minutes')}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {redemption.notes && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">{p('rewards.notesLabel')}:</span>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {redemption.notes}
                    </p>
                  </div>
                )}

                {/* Request Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{p('rewards.requestedLabel')}:</span>
                  <span>{new Date(redemption.requestedAt).toLocaleString()}</span>
                </div>

                {/* Decision Date (if decided) */}
                {redemption.decidedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {redemption.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>{p('rewards.decidedAt')}:</span>
                    <span>{new Date(redemption.decidedAt).toLocaleString()}</span>
                  </div>
                )}

                {/* Decided By (if decided) */}
                {redemption.decidedByUser && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {redemption.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>{p('rewards.decidedByLabel')}:</span>
                    <span className="font-medium">{redemption.decidedByUser.displayName}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status-specific message */}
          {redemption.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">{p('rewards.approvedMessage')}</p>
                  <p className="text-sm text-green-700 mt-1">{p('rewards.approvedDescription')}</p>
                </div>
              </div>
            </div>
          )}

          {redemption.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">{p('rewards.rejectedMessage')}</p>
                  <p className="text-sm text-red-700 mt-1">{p('rewards.rejectedDescription')}</p>
                </div>
              </div>
            </div>
          )}

          {redemption.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">{p('rewards.pendingMessage')}</p>
                  <p className="text-sm text-yellow-700 mt-1">{p('rewards.pendingDescription')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {redemption.status === 'rejected' && onRequestAgain && (
            <Button
              variant="outline"
              onClick={handleRequestAgain}
              className="w-full sm:w-auto"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {p('rewards.requestAgain')}
            </Button>
          )}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {commonT('back')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
