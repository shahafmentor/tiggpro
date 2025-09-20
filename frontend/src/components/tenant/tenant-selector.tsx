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
import { Badge } from '@/components/ui/badge'
import { tenantsApi } from '@/lib/api/tenants'
import { useTenant } from '@/lib/contexts/tenant-context'
import { cn } from '@/lib/utils'

export function TenantSelector() {
  const { currentTenant, setCurrentTenant } = useTenant()
  const { data: session, status } = useSession()

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

  if (tenants.length === 0) {
    return (
      <Button
        variant="outline"
        className="gap-2"
        size="sm"
        onClick={() => window.location.href = '/dashboard/family'}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Create Family</span>
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
              <Badge variant="secondary" className="text-xs">
                {currentTenant.role}
              </Badge>
            </>
          ) : (
            <span>Select Family</span>
          )}
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Switch Family</DropdownMenuLabel>
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
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    tenant.role === 'ADMIN' && "bg-yellow-100 text-yellow-800",
                    tenant.role === 'PARENT' && "bg-blue-100 text-blue-800",
                    tenant.role === 'CHILD' && "bg-green-100 text-green-800"
                  )}
                >
                  {tenant.role}
                </Badge>
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
          Manage Families
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
