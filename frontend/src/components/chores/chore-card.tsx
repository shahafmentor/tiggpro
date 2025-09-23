'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckSquare, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Assignment } from '@/lib/api/assignments'

export interface ChoreCardData {
  id: string
  title: string
  description: string
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  assignedTo?: { name: string; avatar?: string }
  dueDate: string
  estimatedTime: number
  assignment?: Assignment
}

interface ChoreCardProps {
  chore: ChoreCardData
  isChild: boolean
  onClick?: (id: string) => void
  onAssign?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onSubmitAssignment?: (assignment: Assignment) => void
}

export function ChoreCard({ chore, isChild, onClick, onAssign, onSubmitAssignment, onEdit, onDelete }: ChoreCardProps) {
  const getStatusColor = (status?: string) => {
    switch ((status || 'PENDING').toUpperCase()) {
      case 'PENDING':
        return 'bg-chore-pending'
      case 'IN_PROGRESS':
        return 'bg-chore-in-progress'
      case 'SUBMITTED':
        return 'bg-chore-submitted'
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-chore-completed'
      case 'REJECTED':
      case 'OVERDUE':
        return 'bg-chore-overdue'
      default:
        return 'bg-muted'
    }
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(chore.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1">
              {chore.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {chore.description}
            </p>
          </div>
          {chore.assignment && (
            <Badge
              className={cn(
                'ml-2 text-white font-medium',
                getStatusColor(chore.assignment.status?.toUpperCase())
              )}
            >
              {chore.assignment.status?.replace('_', ' ') || 'Not Assigned'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{chore.estimatedTime}m</span>
          </div>
        </div>

        {chore.assignedTo && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={chore.assignedTo.avatar} alt={chore.assignedTo.name} />
                <AvatarFallback className="text-xs">
                  {chore.assignedTo.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">{chore.assignedTo.name}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{chore.dueDate}</span>
          {isChild && chore.assignment && chore.assignment.status?.toUpperCase() === 'OVERDUE' && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Badge variant="secondary" className="bg-points-primary/10 text-points-primary font-medium">
            {chore.points} points
          </Badge>
          <div className="flex items-center gap-2">
            {isChild && chore.assignment && (
              <>
                {chore.assignment.status?.toUpperCase() === 'PENDING' && (
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSubmitAssignment?.(chore.assignment!)
                    }}
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Submit
                  </Button>
                )}
                {chore.assignment.status?.toUpperCase() === 'OVERDUE' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSubmitAssignment?.(chore.assignment!)
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Submit
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


