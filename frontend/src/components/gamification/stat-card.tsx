'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number | ReactNode
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
  children?: ReactNode
  animated?: boolean
  delay?: number
  className?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-muted-foreground",
  valueColor = "text-foreground",
  children,
  animated = true,
  delay = 0,
  className
}: StatCardProps) {
  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={cn("text-2xl font-bold", valueColor)}>
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}