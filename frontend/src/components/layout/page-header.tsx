'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  badgeContent?: ReactNode
}

export function PageHeader({ title, subtitle, actions, badgeContent }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <span>{title}</span>
          {badgeContent ? (
            <Badge variant="secondary" className="text-sm px-2 py-0.5">
              {badgeContent}
            </Badge>
          ) : null}
        </h1>
        {subtitle ? (
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}


