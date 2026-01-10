'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Repeat,
    Clock,
    Star,
    CalendarDays,
    CalendarRange,
    X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useTenant } from '@/lib/contexts/tenant-context'
import { assignmentsApi, type CalendarAssignment } from '@/lib/api/assignments'
import { tenantsApi } from '@/lib/api/tenants'
import { TenantMemberRole, AssignmentStatus } from '@tiggpro/shared'
import { useCalendarTranslations, useChoresTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'

type ViewMode = 'week' | 'month'

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
}

// Helper to get start of week (Sunday)
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
}

// Helper to get end of week (Saturday)
function getWeekEnd(date: Date): Date {
    const start = getWeekStart(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return end
}

// Helper to get start of month
function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

// Helper to get end of month
function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// Helper to get calendar grid for month view (includes padding days from prev/next month)
function getMonthCalendarDays(date: Date): Date[] {
    const monthStart = getMonthStart(date)
    const monthEnd = getMonthEnd(date)

    // Start from the Sunday of the week containing the 1st
    const calendarStart = getWeekStart(monthStart)

    // End on the Saturday of the week containing the last day
    const lastDayOfMonth = new Date(monthEnd)
    const calendarEnd = getWeekEnd(lastDayOfMonth)

    const days: Date[] = []
    const current = new Date(calendarStart)

    while (current <= calendarEnd) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    return days
}

// Get day names
function getDayName(date: Date, locale: string, short = false): string {
    return date.toLocaleDateString(locale, { weekday: short ? 'narrow' : 'short' })
}

// Check if same day
function isSameDay(date1: Date, date2: Date): boolean {
    return formatDate(date1) === formatDate(date2)
}

// Check if today
function isToday(date: Date): boolean {
    return isSameDay(date, new Date())
}

// Check if same month
function isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
}

// Get status color class
function getStatusColor(status: AssignmentStatus): string {
    switch (status) {
        case AssignmentStatus.APPROVED:
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        case AssignmentStatus.SUBMITTED:
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        case AssignmentStatus.REJECTED:
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        case AssignmentStatus.OVERDUE:
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        default:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
}

// Get status dot color for compact month view
function getStatusDotColor(status: AssignmentStatus): string {
    switch (status) {
        case AssignmentStatus.APPROVED:
            return 'bg-green-500'
        case AssignmentStatus.SUBMITTED:
            return 'bg-yellow-500'
        case AssignmentStatus.REJECTED:
        case AssignmentStatus.OVERDUE:
            return 'bg-red-500'
        default:
            return 'bg-blue-500'
    }
}

// Priority indicator
function getPriorityIndicator(priority: string): React.ReactNode {
    if (priority === 'high') {
        return <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
    }
    return null
}

export default function CalendarPage() {
    const { data: session } = useSession()
    const { currentTenant } = useTenant()
    const t = useCalendarTranslations()
    const tChores = useChoresTranslations()

    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedChildId, setSelectedChildId] = useState<string>('all')
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)

    const isParentOrAdmin =
        currentTenant?.role === TenantMemberRole.ADMIN ||
        currentTenant?.role === TenantMemberRole.PARENT

    // Calculate date ranges based on view mode
    const { rangeStart, rangeEnd, displayDays } = useMemo(() => {
        if (viewMode === 'week') {
            const start = getWeekStart(currentDate)
            const end = getWeekEnd(currentDate)
            const days: Date[] = []
            const current = new Date(start)
            for (let i = 0; i < 7; i++) {
                days.push(new Date(current))
                current.setDate(current.getDate() + 1)
            }
            return { rangeStart: start, rangeEnd: end, displayDays: days }
        } else {
            const monthDays = getMonthCalendarDays(currentDate)
            const start = monthDays[0]
            const end = monthDays[monthDays.length - 1]
            return { rangeStart: start, rangeEnd: end, displayDays: monthDays }
        }
    }, [viewMode, currentDate])

    // Week day headers for month view
    const weekDayHeaders = useMemo(() => {
        const days: string[] = []
        const date = new Date(2024, 0, 7) // A Sunday
        for (let i = 0; i < 7; i++) {
            days.push(getDayName(date, 'en', true))
            date.setDate(date.getDate() + 1)
        }
        return days
    }, [])

    // Fetch children for filter (parents only)
    const { data: childrenResponse } = useQuery({
        queryKey: ['tenant-children', currentTenant?.tenant.id],
        queryFn: () =>
            currentTenant ? tenantsApi.getTenantMembers(currentTenant.tenant.id) : null,
        enabled: !!currentTenant && isParentOrAdmin,
    })

    const children = useMemo(() => {
        if (!childrenResponse?.success) return []
        return (childrenResponse.data || []).filter(
            (member) => member.role === TenantMemberRole.CHILD
        )
    }, [childrenResponse])

    // Fetch calendar assignments
    const { data: assignmentsResponse, isLoading } = useQuery({
        queryKey: [
            'calendar-assignments',
            currentTenant?.tenant.id,
            formatDate(rangeStart),
            formatDate(rangeEnd),
            selectedChildId,
        ],
        queryFn: () =>
            currentTenant
                ? assignmentsApi.getCalendarAssignments(
                    currentTenant.tenant.id,
                    formatDate(rangeStart),
                    formatDate(rangeEnd),
                    selectedChildId !== 'all' ? selectedChildId : undefined
                )
                : null,
        enabled: !!currentTenant && !!session,
    })

    // Group assignments by date
    const assignmentsByDate = useMemo(() => {
        const assignments: CalendarAssignment[] = assignmentsResponse?.success
            ? assignmentsResponse.data || []
            : []
        const grouped: Record<string, CalendarAssignment[]> = {}
        for (const assignment of assignments) {
            const dateKey = assignment.dueDate.split('T')[0]
            if (!grouped[dateKey]) {
                grouped[dateKey] = []
            }
            grouped[dateKey].push(assignment)
        }
        return grouped
    }, [assignmentsResponse])

    // Selected day's assignments
    const selectedDayAssignments = useMemo(() => {
        if (!selectedDay) return []
        return assignmentsByDate[formatDate(selectedDay)] || []
    }, [selectedDay, assignmentsByDate])

    // Navigation handlers
    const goToPrevious = () => {
        const newDate = new Date(currentDate)
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7)
        } else {
            newDate.setMonth(newDate.getMonth() - 1)
        }
        setCurrentDate(newDate)
        setSelectedDay(null)
    }

    const goToNext = () => {
        const newDate = new Date(currentDate)
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }
        setCurrentDate(newDate)
        setSelectedDay(null)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDay(null)
    }

    if (!session || !currentTenant) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('title')}</h2>
                <p className="text-muted-foreground">Please select a family first</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground hidden sm:block">{t('subtitle')}</p>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <Button
                            variant={viewMode === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => { setViewMode('week'); setSelectedDay(null) }}
                        >
                            <CalendarDays className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">{t('weekView')}</span>
                        </Button>
                        <Button
                            variant={viewMode === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => { setViewMode('month'); setSelectedDay(null) }}
                        >
                            <CalendarRange className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">{t('monthView')}</span>
                        </Button>
                    </div>
                </div>

                {/* Controls row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Child filter (parents only) */}
                    {isParentOrAdmin && children.length > 0 && (
                        <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                            <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
                                <SelectValue placeholder={t('filterByChild')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('allChildren')}</SelectItem>
                                {children.map((child) => (
                                    <SelectItem key={child.user.id} value={child.user.id}>
                                        {child.user.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center gap-1 ml-auto">
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToPrevious}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9" onClick={goToToday}>
                            {t('today')}
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={goToNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Date range header */}
                <div className="text-center text-base sm:text-lg font-medium text-muted-foreground">
                    {viewMode === 'week' ? (
                        <>
                            {rangeStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {' - '}
                            {rangeEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </>
                    ) : (
                        currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                    )}
                </div>
            </div>

            {/* Calendar Grid */}
            {isLoading ? (
                <div className={cn(
                    'grid gap-1',
                    viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
                )}>
                    {Array.from({ length: viewMode === 'week' ? 7 : 35 }).map((_, i) => (
                        <Skeleton key={i} className={viewMode === 'week' ? 'h-[180px]' : 'h-12'} />
                    ))}
                </div>
            ) : viewMode === 'week' ? (
                /* Week View */
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {displayDays.map((day) => {
                        const dateKey = formatDate(day)
                        const dayAssignments = assignmentsByDate[dateKey] || []
                        const today = isToday(day)

                        return (
                            <Card
                                key={dateKey}
                                className={cn(
                                    'min-h-[160px] sm:min-h-[200px] flex flex-col',
                                    today && 'ring-2 ring-primary'
                                )}
                            >
                                <CardHeader className="pb-1 pt-2 px-1 sm:px-3 sm:pt-3 sm:pb-2">
                                    <CardTitle
                                        className={cn(
                                            'text-xs sm:text-sm font-medium flex flex-col items-center gap-0.5 sm:gap-1',
                                            today && 'text-primary'
                                        )}
                                    >
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                                            {getDayName(day, 'en', true)}
                                        </span>
                                        <span
                                            className={cn(
                                                'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-base',
                                                today && 'bg-primary text-primary-foreground'
                                            )}
                                        >
                                            {day.getDate()}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 px-1 sm:px-2 pb-1 sm:pb-2 overflow-y-auto">
                                    {dayAssignments.length === 0 ? (
                                        <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-2 sm:py-4">
                                            {t('noChoresForDay')}
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            {dayAssignments.map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className={cn(
                                                        'p-1 sm:p-2 rounded-md text-[10px] sm:text-xs cursor-pointer hover:opacity-80 transition-opacity',
                                                        getStatusColor(assignment.status as AssignmentStatus)
                                                    )}
                                                >
                                                    <div className="flex items-start gap-0.5 sm:gap-1">
                                                        {assignment.chore.isRecurring && (
                                                            <Repeat className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        {getPriorityIndicator(assignment.priority)}
                                                        <span className="font-medium truncate flex-1 leading-tight">
                                                            {assignment.chore.title}
                                                        </span>
                                                    </div>
                                                    {assignment.assignedTo && isParentOrAdmin && (
                                                        <div className="text-[9px] sm:text-[10px] opacity-75 mt-0.5 truncate">
                                                            {assignment.assignedTo.displayName}
                                                        </div>
                                                    )}
                                                    <div className="hidden sm:flex items-center gap-1 mt-1 text-[10px] opacity-75">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        <span>{assignment.chore.estimatedDurationMinutes} {tChores('min')}</span>
                                                        <span>•</span>
                                                        <span>{assignment.chore.pointsReward} {tChores('pts')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                /* Month View */
                <div className="space-y-2">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1">
                        {weekDayHeaders.map((dayName, i) => (
                            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
                                {dayName}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {displayDays.map((day) => {
                            const dateKey = formatDate(day)
                            const dayAssignments = assignmentsByDate[dateKey] || []
                            const today = isToday(day)
                            const isCurrentMonth = isSameMonth(day, currentDate)
                            const isSelected = selectedDay && isSameDay(day, selectedDay)

                            return (
                                <button
                                    key={dateKey}
                                    onClick={() => setSelectedDay(isSelected ? null : day)}
                                    className={cn(
                                        'relative h-12 sm:h-14 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5',
                                        'hover:bg-accent hover:border-accent-foreground/20',
                                        !isCurrentMonth && 'opacity-40',
                                        today && 'ring-2 ring-primary',
                                        isSelected && 'bg-accent border-primary'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'text-sm sm:text-base font-medium',
                                            today && 'text-primary'
                                        )}
                                    >
                                        {day.getDate()}
                                    </span>

                                    {/* Status dots */}
                                    {dayAssignments.length > 0 && (
                                        <div className="flex items-center gap-0.5">
                                            {dayAssignments.slice(0, 3).map((assignment, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        'w-1.5 h-1.5 rounded-full',
                                                        getStatusDotColor(assignment.status as AssignmentStatus)
                                                    )}
                                                />
                                            ))}
                                            {dayAssignments.length > 3 && (
                                                <span className="text-[9px] text-muted-foreground">
                                                    +{dayAssignments.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Selected day details */}
                    {selectedDay && (
                        <Card className="mt-4 animate-in slide-in-from-bottom-2 duration-200">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        {selectedDay.toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setSelectedDay(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedDayAssignments.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        {t('noChoresForDay')}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDayAssignments.map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className={cn(
                                                    'p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity',
                                                    getStatusColor(assignment.status as AssignmentStatus)
                                                )}
                                            >
                                                <div className="flex items-start gap-2">
                                                    {assignment.chore.isRecurring && (
                                                        <Repeat className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    {getPriorityIndicator(assignment.priority)}
                                                    <div className="flex-1 min-w-0">
                                                        <span className="font-medium block truncate">
                                                            {assignment.chore.title}
                                                        </span>
                                                        {assignment.assignedTo && isParentOrAdmin && (
                                                            <div className="text-xs opacity-75 mt-0.5">
                                                                {assignment.assignedTo.displayName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{assignment.chore.estimatedDurationMinutes} {tChores('min')}</span>
                                                    </div>
                                                    <span>•</span>
                                                    <span>{assignment.chore.pointsReward} {tChores('pts')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm pt-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-500" />
                    <span>{tChores('pending')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-yellow-500" />
                    <span>{tChores('submitted')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-green-500" />
                    <span>{tChores('approved')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-red-500" />
                    <span>{tChores('overdue')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Repeat className="h-3 w-3" />
                    <span>{t('recurringIndicator')}</span>
                </div>
            </div>
        </div>
    )
}
