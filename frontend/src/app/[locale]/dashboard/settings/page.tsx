'use client'

import { useQuery } from '@tanstack/react-query'
import { rewardsApi } from '@/lib/api/rewards'
import { useTenant } from '@/lib/contexts/tenant-context'
import { TenantMemberRole } from '@tiggpro/shared'
import { usePagesTranslations } from '@/hooks/use-translations'
import { UnifiedRewardSettings } from '@/components/settings/unified-reward-settings'
import { PageHeader } from '@/components/layout/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { Settings, Shield } from 'lucide-react'

export default function SettingsPage() {
    const { currentTenant } = useTenant()
    const tenantId = currentTenant?.tenant?.id
    const isReviewer = currentTenant?.role === TenantMemberRole.ADMIN || currentTenant?.role === TenantMemberRole.PARENT
    const p = usePagesTranslations()
    const { data: session } = useSession()

    // Settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['rewards-settings', tenantId],
        queryFn: () => tenantId ? rewardsApi.getSettings(tenantId) : Promise.resolve(null),
        enabled: !!tenantId,
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!session || !currentTenant) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <h2 className="text-2xl font-bold mb-4">{p('settings.noFamilySelectedTitle')}</h2>
                <p className="text-lg mb-8 text-center max-w-md">{p('settings.noFamilySelectedDesc')}</p>
            </div>
        )
    }

    if (!isReviewer) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Shield className="h-12 w-12 mb-4" />
                <h2 className="text-2xl font-bold mb-4">{p('settings.accessRestricted')}</h2>
                <p className="text-lg mb-8 text-center max-w-md">{p('settings.onlyParentsAdmins')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title={p('settings.title')}
                subtitle={p('settings.subtitle')}
                icon={<Settings className="h-6 w-6" />}
            />

            {/* Reward Settings */}
            <UnifiedRewardSettings settings={settings?.success ? settings.data : undefined} />
        </div>
    )
}
