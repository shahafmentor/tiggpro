'use client'

import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Check, ChevronDown, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RoleBadge } from '@/components/ui/semantic-badges'
import { tenantsApi } from '@/lib/api/tenants'
import { useTenant } from '@/lib/contexts/tenant-context'
import { usePagesTranslations } from '@/hooks/use-translations'

export function TenantSelector() {
  const { currentTenant, setCurrentTenant } = useTenant()
  const { data: session, status } = useSession()
  const pageT = usePagesTranslations()

  const { data: tenantsResponse, isLoading } = useQuery({
    queryKey: ['tenants', 'my'],
    queryFn: () => tenantsApi.getMyTenants(),
    enabled: status === 'authenticated' && !!session,
  })

  const tenants = useMemo(() =>
    tenantsResponse?.success ? tenantsResponse.data : [],
    [tenantsResponse]
  )

  // Auto-select first tenant if none selected and tenants are available
  useEffect(() => {
    if (!currentTenant && tenants && tenants.length > 0 && !isLoading) {
      setCurrentTenant(tenants[0])
    }
  }, [currentTenant, tenants, isLoading, setCurrentTenant])

  if (isLoading) {
    return (
      <div className="w-48 h-10 bg-muted rounded-md animate-pulse" />
    )
  }

  if (!tenants || tenants.length === 0) {
    return (
      <Button
        variant="outline"
        className="gap-2"
        size="sm"
        onClick={() => window.location.href = '/dashboard/family'}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">{pageT('family.createFamily')}</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-0">
          <Users className="h-4 w-4 flex-shrink-0" />
          {currentTenant ? (
            <>
              <span className="truncate max-w-[120px] sm:max-w-[150px]">
                {currentTenant.tenant.name}
              </span>
              <RoleBadge role={currentTenant.role} />
            </>
          ) : (
            <span>{pageT('family.selectFamily')}</span>
          )}
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>{pageT('family.switchFamily')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.membershipId}
            onClick={() => setCurrentTenant(tenant)}
            className="flex items-center gap-3 py-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {tenant.tenant.name}
                </span>
                {currentTenant?.membershipId === tenant.membershipId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge role={tenant.role} />
                <span className="text-xs text-muted-foreground">
                  {tenant.tenant.tenantCode}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-primary">
          <Plus className="h-4 w-4 mr-2" />
          {pageT('family.manageFamilies')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
