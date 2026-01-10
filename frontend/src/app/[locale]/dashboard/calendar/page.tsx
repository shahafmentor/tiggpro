'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
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
import { TenantMemberRole } from '@tiggpro/shared'
import { useCalendarTranslations, useChoresTranslations } from '@/hooks/use-translations'
import {
    formatDate,
    getWeekStart,
    getWeekEnd,
    getMonthCalendarDays,
    getWeekDays,
    getWeekDayHeaders,
    isSameDay,
} from '@/lib/date-utils'
import {
    WeekDayCell,
    MonthDayCell,
    CalendarAssignmentCard,
    CalendarLegend,
} from '@/components/calendar'

type ViewMode = 'week' | 'month'

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
            return { rangeStart: start, rangeEnd: end, displayDays: getWeekDays(start) }
        } else {
            const monthDays = getMonthCalendarDays(currentDate)
            const start = monthDays[0]
            const end = monthDays[monthDays.length - 1]
            return { rangeStart: start, rangeEnd: end, displayDays: monthDays }
        }
    }, [viewMode, currentDate])

    // Week day headers for month view
    const weekDayHeaders = useMemo(() => getWeekDayHeaders('en'), [])

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

    // Get assignments for a specific day
    const getAssignmentsForDay = (day: Date): CalendarAssignment[] => {
        return assignmentsByDate[formatDate(day)] || []
    }

    // Selected day's assignments
    const selectedDayAssignments = useMemo(() => {
        if (!selectedDay) return []
        return getAssignmentsForDay(selectedDay)
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
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
            <CalendarHeader
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                t={t}
            />

            {/* Controls row */}
            <CalendarControls
                isParentOrAdmin={isParentOrAdmin}
                childMembers={children}
                selectedChildId={selectedChildId}
                onChildChange={setSelectedChildId}
                onPrevious={goToPrevious}
                onNext={goToNext}
                onToday={goToToday}
                t={t}
            />

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

            {/* Calendar Grid */}
            {isLoading ? (
                <CalendarSkeleton viewMode={viewMode} />
            ) : viewMode === 'week' ? (
                <WeekView
                    days={displayDays}
                    getAssignments={getAssignmentsForDay}
                    showAssignee={isParentOrAdmin}
                    noChoresText={t('noChoresForDay')}
                    tMin={tChores('min')}
                    tPts={tChores('pts')}
                />
            ) : (
                <MonthView
                    days={displayDays}
                    currentMonth={currentDate}
                    weekDayHeaders={weekDayHeaders}
                    getAssignments={getAssignmentsForDay}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                    selectedDayAssignments={selectedDayAssignments}
                    showAssignee={isParentOrAdmin}
                    noChoresText={t('noChoresForDay')}
                    tMin={tChores('min')}
                    tPts={tChores('pts')}
                />
            )}

            {/* Legend */}
            <CalendarLegend
                pendingLabel={tChores('pending')}
                submittedLabel={tChores('submitted')}
                approvedLabel={tChores('approved')}
                overdueLabel={tChores('overdue')}
                recurringLabel={t('recurringIndicator')}
            />
        </div>
    )
}

// Sub-components for better organization

interface CalendarHeaderProps {
    viewMode: ViewMode
    onViewModeChange: (mode: ViewMode) => void
    t: (key: string) => string
}

function CalendarHeader({ viewMode, onViewModeChange, t }: CalendarHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold">{t('title')}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">{t('subtitle')}</p>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => onViewModeChange('week')}
                >
                    <CalendarDays className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t('weekView')}</span>
                </Button>
                <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => onViewModeChange('month')}
                >
                    <CalendarRange className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t('monthView')}</span>
                </Button>
            </div>
        </div>
    )
}

interface CalendarControlsProps {
    isParentOrAdmin: boolean
    childMembers: Array<{ user: { id: string; displayName: string } }>
    selectedChildId: string
    onChildChange: (id: string) => void
    onPrevious: () => void
    onNext: () => void
    onToday: () => void
    t: (key: string) => string
}

function CalendarControls({
    isParentOrAdmin,
    childMembers,
    selectedChildId,
    onChildChange,
    onPrevious,
    onNext,
    onToday,
    t,
}: CalendarControlsProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            {isParentOrAdmin && childMembers.length > 0 && (
                <Select value={selectedChildId} onValueChange={onChildChange}>
                    <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
                        <SelectValue placeholder={t('filterByChild')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('allChildren')}</SelectItem>
                        {childMembers.map((child) => (
                            <SelectItem key={child.user.id} value={child.user.id}>
                                {child.user.displayName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <div className="flex items-center gap-1 ml-auto">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={onPrevious}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-9" onClick={onToday}>
                    {t('today')}
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={onNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

interface CalendarSkeletonProps {
    viewMode: ViewMode
}

function CalendarSkeleton({ viewMode }: CalendarSkeletonProps) {
    const count = viewMode === 'week' ? 7 : 35
    const height = viewMode === 'week' ? 'h-[180px]' : 'h-12'

    return (
        <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className={height} />
            ))}
        </div>
    )
}

interface WeekViewProps {
    days: Date[]
    getAssignments: (day: Date) => CalendarAssignment[]
    showAssignee: boolean
    noChoresText: string
    tMin: string
    tPts: string
}

function WeekView({
    days,
    getAssignments,
    showAssignee,
    noChoresText,
    tMin,
    tPts,
}: WeekViewProps) {
    return (
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((day) => (
                <WeekDayCell
                    key={formatDate(day)}
                    day={day}
                    assignments={getAssignments(day)}
                    showAssignee={showAssignee}
                    noChoresText={noChoresText}
                    tMin={tMin}
                    tPts={tPts}
                />
            ))}
        </div>
    )
}

interface MonthViewProps {
    days: Date[]
    currentMonth: Date
    weekDayHeaders: string[]
    getAssignments: (day: Date) => CalendarAssignment[]
    selectedDay: Date | null
    onSelectDay: (day: Date | null) => void
    selectedDayAssignments: CalendarAssignment[]
    showAssignee: boolean
    noChoresText: string
    tMin: string
    tPts: string
}

function MonthView({
    days,
    currentMonth,
    weekDayHeaders,
    getAssignments,
    selectedDay,
    onSelectDay,
    selectedDayAssignments,
    showAssignee,
    noChoresText,
    tMin,
    tPts,
}: MonthViewProps) {
    return (
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
                {days.map((day) => (
                    <MonthDayCell
                        key={formatDate(day)}
                        day={day}
                        currentMonth={currentMonth}
                        assignments={getAssignments(day)}
                        isSelected={selectedDay ? isSameDay(day, selectedDay) : false}
                        onSelect={onSelectDay}
                    />
                ))}
            </div>

            {/* Selected day details */}
            {selectedDay && (
                <SelectedDayPanel
                    selectedDay={selectedDay}
                    assignments={selectedDayAssignments}
                    onClose={() => onSelectDay(null)}
                    showAssignee={showAssignee}
                    noChoresText={noChoresText}
                    tMin={tMin}
                    tPts={tPts}
                />
            )}
        </div>
    )
}

interface SelectedDayPanelProps {
    selectedDay: Date
    assignments: CalendarAssignment[]
    onClose: () => void
    showAssignee: boolean
    noChoresText: string
    tMin: string
    tPts: string
}

function SelectedDayPanel({
    selectedDay,
    assignments,
    onClose,
    showAssignee,
    noChoresText,
    tMin,
    tPts,
}: SelectedDayPanelProps) {
    return (
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
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {noChoresText}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {assignments.map((assignment) => (
                            <CalendarAssignmentCard
                                key={assignment.id}
                                assignment={assignment}
                                showAssignee={showAssignee}
                                tMin={tMin}
                                tPts={tPts}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
