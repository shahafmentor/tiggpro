'use client'

import { useState, ReactNode } from 'react'
import { LucideIcon, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CountBadge } from '@/components/ui/semantic-badges'

interface DashboardListSectionProps<T = Record<string, unknown>> {
  title: string
  icon: LucideIcon
  items: T[]
  isLoading?: boolean
  error?: string | null
  emptyStateIcon?: LucideIcon
  emptyStateTitle?: string
  emptyStateDescription?: string
  errorMessage?: string
  showCount?: boolean
  maxInitialItems?: number
  showMoreText?: string
  showLessText?: string
  headerActions?: ReactNode
  children: (item: T, index: number) => ReactNode
}

export function DashboardListSection({
  title,
  icon: Icon,
  items,
  isLoading = false,
  error = null,
  emptyStateIcon: EmptyStateIcon = Icon,
  emptyStateTitle,
  emptyStateDescription,
  errorMessage,
  showCount = true,
  maxInitialItems = 3,
  showMoreText,
  showLessText,
  headerActions,
  children
}: DashboardListSectionProps) {
  const [showAll, setShowAll] = useState(false)

  const displayItems = showAll ? items : items.slice(0, maxInitialItems)
  const hasMoreItems = items.length > maxInitialItems

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
          {showCount && items.length > 0 && (
            <CountBadge count={items.length} className="ml-auto" />
          )}
        </CardTitle>
        {headerActions && (
          <div className="flex gap-2 mt-2">
            {headerActions}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{errorMessage || 'Failed to load data'}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <EmptyStateIcon className="h-8 w-8 mx-auto mb-2" />
            <p>{emptyStateTitle || 'No items found'}</p>
            {emptyStateDescription && (
              <p className="text-sm">{emptyStateDescription}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, index) => (
              <div key={('id' in item && typeof item.id === 'string') ? item.id : index}>
                {children(item, index)}
              </div>
            ))}
            {hasMoreItems && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    {showLessText || 'Show Less'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    {showMoreText || `View All (${items.length})`}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
