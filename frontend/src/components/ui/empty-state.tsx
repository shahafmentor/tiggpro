'use client'

import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon ? <div className="mx-auto mb-4 flex items-center justify-center">{icon}</div> : null}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mb-4">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  )
}


