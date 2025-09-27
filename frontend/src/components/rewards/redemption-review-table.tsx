'use client'

import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, RefreshCcw, Filter } from 'lucide-react'
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
import { RedemptionStatus } from '@tiggpro/shared'

interface Redemption {
    id: string
    status: RedemptionStatus
    requestedAt: string
    userId: string
    user?: {
        displayName: string
        email: string
        avatarUrl?: string
    }
    type: string
    amount?: number
    notes?: string
}

interface RedemptionReviewTableProps {
    redemptions: Redemption[]
    isLoading?: boolean
    isChild?: boolean
    onReview?: (redemption: Redemption) => void
    onReject?: (redemption: Redemption) => void
    onRequestAgain?: (redemption: Redemption) => void
    emptyStateIcon?: React.ReactNode
    emptyStateTitle?: string
    emptyStateDescription?: string
    emptyStateAction?: React.ReactNode
}

export function RedemptionReviewTable({
    redemptions,
    isLoading = false,
    isChild = false,
    onReview,
    onReject,
    onRequestAgain,
    emptyStateIcon,
    emptyStateTitle,
    emptyStateDescription,
    emptyStateAction,
}: RedemptionReviewTableProps) {
    const p = usePagesTranslations()
    const [sortField, setSortField] = useState<string>('requestedAt')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [statusFilter, setStatusFilter] = useState<string>(isChild ? 'all' : 'pending')

    // Filter redemptions based on status
    const filteredRedemptions = redemptions.filter((redemption) => {
        switch (statusFilter) {
            case 'all':
                return true
            case 'pending':
                return redemption.status === 'pending'
            case 'approved':
                return redemption.status === 'approved'
            case 'rejected':
                return redemption.status === 'rejected'
            default:
                return true
        }
    })

    // Sort redemptions
    const sortedRedemptions = [...filteredRedemptions].sort((a, b) => {
        let aVal, bVal

        switch (sortField) {
            case 'type':
                aVal = a.type
                bVal = b.type
                break
            case 'requestedBy':
                aVal = a.user?.displayName || ''
                bVal = b.user?.displayName || ''
                break
            case 'status':
                aVal = a.status
                bVal = b.status
                break
            case 'requestedAt':
                aVal = new Date(a.requestedAt).getTime()
                bVal = new Date(b.requestedAt).getTime()
                break
            case 'amount':
                aVal = a.amount || 0
                bVal = b.amount || 0
                break
            default:
                aVal = a.requestedAt
                bVal = b.requestedAt
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

    if (sortedRedemptions.length === 0) {
        return (
            <Card>
                <CardContent>
                    <EmptyState
                        icon={emptyStateIcon}
                        title={emptyStateTitle || p('rewards.noRequests')}
                        description={emptyStateDescription || p('rewards.createFirst')}
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
                    <CardTitle>
                        {isChild ? p('rewards.myRequests') : p('rewards.allRequests')}
                    </CardTitle>
                    {isChild ? (
                        <div className="flex flex-wrap gap-2 pt-4">
                            <Button
                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('all')}
                                className="gap-2"
                            >
                                {p('rewards.filterButtons.allRequests')}
                            </Button>
                            <Button
                                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('pending')}
                                className="gap-2"
                            >
                                <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                                {p('rewards.filterButtons.waitingForReview')}
                            </Button>
                            <Button
                                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('approved')}
                                className="gap-2"
                            >
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                {p('rewards.filterButtons.approved')}
                            </Button>
                            <Button
                                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('rejected')}
                                className="gap-2"
                            >
                                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                                {p('rewards.filterButtons.needChanges')}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 pt-4">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={p('rewards.filterByStatus')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{p('rewards.allStatuses')}</SelectItem>
                                    <SelectItem value="pending">{p('rewards.pendingOnly')}</SelectItem>
                                    <SelectItem value="approved">{p('rewards.approvedOnly')}</SelectItem>
                                    <SelectItem value="rejected">{p('rewards.rejectedOnly')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
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
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('rewards.tableHeaders.type')}
                                        {getSortIcon('type')}
                                    </div>
                                </TableHead>
                                {!isChild && (
                                    <TableHead
                                        className="cursor-pointer select-none hover:bg-muted/50"
                                        onClick={() => handleSort('requestedBy')}
                                    >
                                        <div className="flex items-center gap-2">
                                            {p('rewards.tableHeaders.requestedBy')}
                                            {getSortIcon('requestedBy')}
                                        </div>
                                    </TableHead>
                                )}
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('rewards.tableHeaders.amount')}
                                        {getSortIcon('amount')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('rewards.tableHeaders.status')}
                                        {getSortIcon('status')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer select-none hover:bg-muted/50"
                                    onClick={() => handleSort('requestedAt')}
                                >
                                    <div className="flex items-center gap-2">
                                        {p('rewards.tableHeaders.requestedAt')}
                                        {getSortIcon('requestedAt')}
                                    </div>
                                </TableHead>
                                <TableHead className="text-center">{p('rewards.tableHeaders.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedRedemptions.map((redemption) => (
                                <TableRow key={redemption.id}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="secondary">{p(`rewards.types.${redemption.type}` as any)}</Badge>
                                            {redemption.notes && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {redemption.notes}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    {!isChild && (
                                        <TableCell>
                                            {redemption.user ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage
                                                            src={redemption.user.avatarUrl}
                                                            alt={redemption.user.displayName}
                                                        />
                                                        <AvatarFallback className="text-xs">
                                                            {redemption.user.displayName
                                                                .split(' ')
                                                                .map((n: string) => n[0])
                                                                .join('')
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">
                                                        {redemption.user.displayName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Unknown</span>
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {redemption.amount ? (
                                            <span className="text-sm">{redemption.amount}</span>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={redemption.status as any} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(redemption.requestedAt).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center py-2">
                                        <div className="flex items-center justify-center gap-2">
                                            {!isChild && redemption.status === 'pending' && onReview && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onReview(redemption)}
                                                        className="min-w-[80px]"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        {p('rewards.actions.review')}
                                                    </Button>
                                                    {onReject && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onReject(redemption)}
                                                            className="min-w-[80px]"
                                                        >
                                                            {p('rewards.actions.reject')}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                            {isChild && redemption.status === 'rejected' && onRequestAgain && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onRequestAgain(redemption)}
                                                    className="min-w-[120px]"
                                                >
                                                    <RefreshCcw className="h-3 w-3 mr-1" />
                                                    {p('rewards.actions.requestAgain')}
                                                </Button>
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
