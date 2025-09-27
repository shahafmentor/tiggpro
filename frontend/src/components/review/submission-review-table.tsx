'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/semantic-badges'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { usePagesTranslations } from '@/hooks/use-translations'
import { ReviewStatus } from '@tiggpro/shared'
import type { Submission } from '@/lib/api/assignments'

interface SubmissionReviewTableProps {
    submissions: Submission[]
    isLoading?: boolean
    onReview?: (submission: Submission) => void
    onReject?: (submission: Submission) => void
    emptyStateIcon?: React.ReactNode
    emptyStateTitle?: string
    emptyStateDescription?: string
    emptyStateAction?: React.ReactNode
}

export function SubmissionReviewTable({
    submissions,
    isLoading = false,
    onReview,
    onReject,
    emptyStateIcon,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateAction,
}: SubmissionReviewTableProps) {
    const p = usePagesTranslations()
    const [sortField, setSortField] = useState<string>('submittedAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [statusFilter, setStatusFilter] = useState<string>('pending')

    // Filter submissions based on status
    const filteredSubmissions = submissions.filter((submission) => {
        switch (statusFilter) {
            case 'all':
                return true
            case 'pending':
                return submission.reviewStatus === 'pending'
            case 'approved':
                return submission.reviewStatus === 'approved'
            case 'rejected':
                return submission.reviewStatus === 'rejected'
            default:
                return true
        }
    })

    // Sort submissions
    const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
        let aVal, bVal

        switch (sortField) {
            case 'chore':
                aVal = a.assignment?.chore?.title || ''
                bVal = b.assignment?.chore?.title || ''
                break
            case 'submittedBy':
                aVal = a.assignment?.assignedTo?.displayName || ''
                bVal = b.assignment?.assignedTo?.displayName || ''
                break
            case 'status':
                aVal = a.reviewStatus
                bVal = b.reviewStatus
                break
            case 'submittedAt':
                aVal = new Date(a.submittedAt).getTime()
                bVal = new Date(b.submittedAt).getTime()
                break
            case 'points':
                aVal = a.assignment?.chore?.pointsReward || 0
                bVal = b.assignment?.chore?.pointsReward || 0
                break
            default:
                aVal = a.submittedAt
                bVal = b.submittedAt
        }

        if (sortDirection === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
    })

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const getSortIcon = (field: string) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4" />
        }
        return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (sortedSubmissions.length === 0) {
        return (
            <Card>
                <CardContent>
                    <EmptyState
                        icon={emptyStateIcon}
                        title={emptyStateTitle || p('review.noSubmissions')}
                        description={emptyStateDescription || p('review.noSubmissionsDesc')}
                        action={emptyStateAction}
                    />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filter Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{p('review.allSubmissions')}</CardTitle>
                    <div className="flex items-center gap-2 pt-4">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={p('review.filterByStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{p('review.allStatuses')}</SelectItem>
                                <SelectItem value="pending">{p('review.pendingOnly')}</SelectItem>
                                <SelectItem value="approved">{p('review.approvedOnly')}</SelectItem>
                                <SelectItem value="rejected">{p('review.rejectedOnly')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
            </Card>

            {/* Table */}
            <Card>
                <CardContent>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('chore')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('review.tableHeaders.chore')}
                                        {getSortIcon('chore')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('submittedBy')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('review.tableHeaders.submittedBy')}
                                        {getSortIcon('submittedBy')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('points')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('review.tableHeaders.points')}
                                        {getSortIcon('points')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('review.tableHeaders.status')}
                                        {getSortIcon('status')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('submittedAt')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('review.tableHeaders.submittedAt')}
                                        {getSortIcon('submittedAt')}
                                    </div>
                                </TableHead>
                                <TableHead className="text-center">{p('review.tableHeaders.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedSubmissions.map((submission) => (
                                <TableRow key={submission.id}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="secondary">
                                                {submission.assignment?.chore?.title || 'Unknown Chore'}
                                            </Badge>
                                            {submission.submissionNotes && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {submission.submissionNotes}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {submission.assignment?.assignedTo ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage
                                                        src={submission.assignment.assignedTo.avatarUrl}
                                                        alt={submission.assignment.assignedTo.displayName}
                                                    />
                                                    <AvatarFallback className="text-xs">
                                                        {submission.assignment.assignedTo.displayName
                                                            .split(' ')
                                                            .map((n: string) => n[0])
                                                            .join('')
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">
                                                    {submission.assignment.assignedTo.displayName}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Unknown</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {submission.assignment?.chore?.pointsReward || 0} pts
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={submission.reviewStatus as any} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(submission.submittedAt).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center py-2">
                                        <div className="flex items-center justify-center gap-2">
                                            {submission.reviewStatus === 'pending' && onReview && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onReview(submission)}
                                                        className="min-w-[80px]"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        {p('review.actions.review')}
                                                    </Button>
                                                    {onReject && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onReject(submission)}
                                                            className="min-w-[80px]"
                                                        >
                                                            {p('review.actions.reject')}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
