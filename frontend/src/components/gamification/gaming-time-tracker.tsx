'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Minus,
  Gamepad2,
  Timer,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GamingTimeTrackerProps {
  availableMinutes: number
  usedMinutes: number
  totalEarnedMinutes?: number
  onRedeemTime?: (minutes: number) => Promise<void>
  onStartSession?: () => void
  onEndSession?: () => void
  className?: string
  variant?: 'compact' | 'detailed'
}

interface TimeDisplayProps {
  minutes: number
  label: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  className?: string
}

function TimeDisplay({ minutes, label, variant = 'secondary', className }: TimeDisplayProps) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary'
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-orange-600 dark:text-orange-400'
      default:
        return 'text-foreground'
    }
  }

  return (
    <div className={cn('text-center', className)}>
      <div className={cn('text-2xl font-bold', getVariantStyles())}>
        {formatTime()}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  )
}

function RedeemTimeSection({
  availableMinutes,
  onRedeemTime
}: {
  availableMinutes: number
  onRedeemTime?: (minutes: number) => Promise<void>
}) {
  const [redeemAmount, setRedeemAmount] = useState(15)
  const [isRedeeming, setIsRedeeming] = useState(false)

  const handleRedeemTime = async () => {
    if (!onRedeemTime || redeemAmount <= 0 || redeemAmount > availableMinutes) return

    setIsRedeeming(true)
    try {
      await onRedeemTime(redeemAmount)
      setRedeemAmount(15) // Reset to default
    } catch (error) {
      console.error('Failed to redeem gaming time:', error)
    } finally {
      setIsRedeeming(false)
    }
  }

  const adjustRedeemAmount = (delta: number) => {
    const newAmount = Math.max(0, Math.min(availableMinutes, redeemAmount + delta))
    setRedeemAmount(newAmount)
  }

  const canRedeem = availableMinutes > 0 && redeemAmount > 0 && redeemAmount <= availableMinutes

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="redeem-amount" className="text-sm font-medium">
          Redeem Gaming Time
        </Label>
        <Badge variant="outline" className="text-xs">
          {availableMinutes}m available
        </Badge>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustRedeemAmount(-5)}
          disabled={redeemAmount <= 5}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>

        <div className="flex-1">
          <Input
            id="redeem-amount"
            type="number"
            min="0"
            max={availableMinutes}
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-center h-8"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustRedeemAmount(5)}
          disabled={redeemAmount >= availableMinutes}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Button
        onClick={handleRedeemTime}
        disabled={!canRedeem || isRedeeming}
        className="w-full"
        size="sm"
      >
        <Gamepad2 className="h-4 w-4 mr-2" />
        {isRedeeming ? 'Redeeming...' : `Redeem ${redeemAmount}m`}
      </Button>
    </div>
  )
}

export function GamingTimeTracker({
  availableMinutes,
  usedMinutes,
  totalEarnedMinutes = 0,
  onRedeemTime,
  onStartSession,
  onEndSession,
  variant = 'compact',
  className
}: GamingTimeTrackerProps) {
  const [isSessionActive, setIsSessionActive] = useState(false)

  const totalMinutes = availableMinutes + usedMinutes
  const usagePercentage = totalMinutes > 0 ? (usedMinutes / totalMinutes) * 100 : 0

  const handleStartSession = () => {
    setIsSessionActive(true)
    onStartSession?.()
  }

  const handleEndSession = () => {
    setIsSessionActive(false)
    onEndSession?.()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Gaming Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time Overview */}
        <div className="grid grid-cols-2 gap-4">
          <TimeDisplay
            minutes={availableMinutes}
            label="Available"
            variant="primary"
          />
          <TimeDisplay
            minutes={usedMinutes}
            label="Used Today"
            variant="secondary"
          />
        </div>

        {/* Usage Progress */}
        {totalMinutes > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage Today</span>
              <span className="font-medium">
                {usedMinutes}m / {totalMinutes}m
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
        )}

        {variant === 'detailed' && totalEarnedMinutes > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Total Earned</span>
            </div>
            <Badge variant="secondary">
              {totalEarnedMinutes}m this week
            </Badge>
          </div>
        )}

        {/* Session Controls */}
        {variant === 'detailed' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Session Control</Label>
            <div className="flex gap-2">
              {!isSessionActive ? (
                <Button
                  onClick={handleStartSession}
                  disabled={availableMinutes === 0}
                  className="flex-1"
                  variant="default"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Gaming
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleEndSession}
                    className="flex-1"
                    variant="outline"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Session
                  </Button>
                  <Button
                    variant="outline"
                    className="px-3"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Redeem Time Section */}
        {availableMinutes > 0 && onRedeemTime && variant === 'detailed' && (
          <RedeemTimeSection
            availableMinutes={availableMinutes}
            onRedeemTime={onRedeemTime}
          />
        )}

        {/* Quick Redeem Buttons for Compact Mode */}
        {availableMinutes > 0 && onRedeemTime && variant === 'compact' && (
          <div className="flex gap-2">
            {[15, 30, 60].filter(amount => amount <= availableMinutes).map(amount => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => onRedeemTime(amount)}
                className="flex-1"
              >
                {amount}m
              </Button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {availableMinutes === 0 && (
          <div className="text-center py-4">
            <Timer className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No gaming time available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Complete chores to earn more time!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}