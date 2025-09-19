'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  Calendar,
  CheckSquare,
  Clock,
  Filter,
  Plus,
  Search,
  Star,
  User,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EditChoreModal } from '@/components/chores/edit-chore-modal'
import { choresApi, Chore } from '@/lib/api/chores'
import { DifficultyLevel } from '@tiggpro/shared'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Skeleton } from '@/components/ui/skeleton'

interface MockChore {
  id: string
  title: string
  description: string
  points: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  assignedTo?: {
    name: string
    avatar?: string
  }
  dueDate: string
  estimatedTime: number // in minutes
}

export default function ChoresPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [editingChore, setEditingChore] = useState<Chore | null>(null)
  const [deletingChore, setDeletingChore] = useState<Chore | null>(null)
  const router = useRouter()
  const { data: session } = useSession()
  const { currentTenant } = useTenant()
  const queryClient = useQueryClient()

  // Fetch real chores data
  const { data: choresResponse, isLoading, error } = useQuery({
    queryKey: ['chores', currentTenant?.tenant.id],
    queryFn: () => currentTenant ? choresApi.getChoresByTenant(currentTenant.tenant.id) : null,
    enabled: !!currentTenant && !!session,
  })

  const chores: Chore[] = choresResponse?.success ? choresResponse.data : []

  // Convert real chores to display format for compatibility with existing UI
  const displayChores = chores.map((chore): MockChore => ({
    id: chore.id,
    title: chore.title,
    description: chore.description || 'No description provided',
    points: chore.pointsReward,
    difficulty: chore.difficultyLevel.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD',
    status: 'PENDING' as const, // TODO: Implement real status based on assignments
    assignedTo: undefined, // TODO: Implement real assignment data
    dueDate: 'No due date', // TODO: Implement due dates
    estimatedTime: chore.estimatedDurationMinutes,
  }))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    )
  }

  if (!session || !currentTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <h2 className="text-2xl font-bold mb-4">No Family Selected</h2>
        <p className="text-lg mb-8 text-center max-w-md">
          Please select a family to view and manage chores.
        </p>
      </div>
    )
  }

  const getStatusColor = (status: MockChore['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-chore-pending'
      case 'IN_PROGRESS':
        return 'bg-chore-in-progress'
      case 'COMPLETED':
        return 'bg-chore-completed'
      case 'OVERDUE':
        return 'bg-chore-overdue'
      default:
        return 'bg-muted'
    }
  }

  const getDifficultyIcon = (difficulty: MockChore['difficulty']) => {
    switch (difficulty) {
      case 'EASY':
        return <Star className="h-4 w-4 text-green-500" />
      case 'MEDIUM':
        return (
          <div className="flex gap-0.5">
            <Star className="h-4 w-4 text-yellow-500" />
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
        )
      case 'HARD':
        return (
          <div className="flex gap-0.5">
            <Star className="h-4 w-4 text-red-500" />
            <Star className="h-4 w-4 text-red-500" />
            <Star className="h-4 w-4 text-red-500" />
          </div>
        )
      default:
        return null
    }
  }

  const filteredChores = displayChores.filter(chore => {
    const matchesSearch = chore.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chore.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || chore.status === statusFilter.toUpperCase()
    const matchesDifficulty = difficultyFilter === 'all' || chore.difficulty === difficultyFilter.toUpperCase()

    return matchesSearch && matchesStatus && matchesDifficulty
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chores</h1>
          <p className="text-muted-foreground">
            Manage and track family chores
          </p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/dashboard/chores/new')}>
          <Plus className="h-4 w-4" />
          Add Chore
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chore Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChores.map((chore) => (
          <Card
            key={chore.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => {
              // Open chore details/edit modal when clicking the card
              const originalChore = chores.find(c => c.id === chore.id)
              if (originalChore) setEditingChore(originalChore)
            }}
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
                <Badge
                  className={cn(
                    "ml-2 text-white font-medium",
                    getStatusColor(chore.status)
                  )}
                >
                  {chore.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chore Details */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{chore.estimatedTime}m</span>
                </div>
                <div className="flex items-center gap-1">
                  {getDifficultyIcon(chore.difficulty)}
                </div>
              </div>

              {/* Assigned To */}
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

              {/* Due Date */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{chore.dueDate}</span>
              </div>

              {/* Points and Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Badge variant="secondary" className="bg-points-primary/10 text-points-primary font-medium">
                  {chore.points} points
                </Badge>
                <div className="flex items-center gap-2">
                  {chore.status === 'PENDING' && (
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent card click
                        // TODO: Implement start chore functionality
                        toast.info('Start chore functionality coming soon!')
                      }}
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                  {chore.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent card click
                        // TODO: Implement complete chore functionality
                        toast.info('Complete chore functionality coming soon!')
                      }}
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  )}
                  {chore.status === 'COMPLETED' && (
                    <Badge variant="secondary" className="bg-chore-completed/10 text-chore-completed">
                      Done ✓
                    </Badge>
                  )}
                  {chore.status === 'OVERDUE' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent card click
                        // TODO: Implement urgent chore functionality
                        toast.info('Urgent chore handling coming soon!')
                      }}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Urgent
                    </Button>
                  )}

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const originalChore = chores.find(c => c.id === chore.id)
                        if (originalChore) setEditingChore(originalChore)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const originalChore = chores.find(c => c.id === chore.id)
                          if (originalChore) setDeletingChore(originalChore)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredChores.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No chores found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || difficultyFilter !== 'all'
                ? 'Try adjusting your filters to see more chores.'
                : 'Get started by creating your first chore!'}
            </p>
            <Button onClick={() => router.push('/dashboard/chores/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Chore
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Chore Modal */}
      <EditChoreModal
        chore={editingChore}
        open={!!editingChore}
        onOpenChange={(open) => !open && setEditingChore(null)}
        onSuccess={() => {
          toast.success('Chore updated successfully!')
          setEditingChore(null)
          // Refetch chores to show updated data
          queryClient.invalidateQueries({ queryKey: ['chores', currentTenant?.tenant.id] })
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingChore} onOpenChange={(open) => !open && setDeletingChore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingChore?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingChore && currentTenant) {
                  try {
                    const response = await choresApi.deleteChore(currentTenant.tenant.id, deletingChore.id)
                    if (response.success) {
                      toast.success('Chore deleted successfully!')
                      // Refresh the chores list
                      queryClient.invalidateQueries({ queryKey: ['chores', currentTenant.tenant.id] })
                    } else {
                      toast.error(response.error || 'Failed to delete chore')
                    }
                  } catch (error) {
                    toast.error('Failed to delete chore')
                  }
                  setDeletingChore(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
