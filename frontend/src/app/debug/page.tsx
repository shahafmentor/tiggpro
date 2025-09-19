'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { tenantsApi } from '@/lib/api/tenants'
import { choresApi } from '@/lib/api/chores'
import { getAuthToken } from '@/lib/auth-utils'

export default function DebugPage() {
  const { data: session } = useSession()
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testAuthToken = async () => {
    setIsLoading(true)
    try {
      const token = await getAuthToken()
      if (token) {
        addResult(`✅ JWT Token obtained: ${token.substring(0, 20)}...`)
      } else {
        addResult(`❌ No JWT token available`)
      }
    } catch (error) {
      addResult(`❌ Error getting token: ${error}`)
    }
    setIsLoading(false)
  }

  const testCreateTenant = async () => {
    setIsLoading(true)
    try {
      const result = await tenantsApi.createTenant({
        name: `Debug Family ${Date.now()}`,
        type: 'family' as any
      })
      
      if (result.success) {
        addResult(`✅ Tenant created: ${result.data?.name} (${result.data?.tenantCode})`)
      } else {
        addResult(`❌ Tenant creation failed: ${result.error}`)
      }
    } catch (error) {
      addResult(`❌ Error creating tenant: ${error}`)
    }
    setIsLoading(false)
  }

  const testGetTenants = async () => {
    setIsLoading(true)
    try {
      const result = await tenantsApi.getMyTenants()
      
      if (result.success) {
        addResult(`✅ Got ${result.data?.length || 0} tenants`)
        result.data?.forEach((tenant, i) => {
          addResult(`  ${i + 1}. ${tenant.tenant.name} (${tenant.tenant.tenantCode})`)
        })
      } else {
        addResult(`❌ Get tenants failed: ${result.error}`)
      }
    } catch (error) {
      addResult(`❌ Error getting tenants: ${error}`)
    }
    setIsLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Debug Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please sign in to test the API integration.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Integration Debug</CardTitle>
          <p className="text-muted-foreground">
            Testing real API calls with authentication
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={testAuthToken} disabled={isLoading}>
              Test Auth Token
            </Button>
            <Button onClick={testCreateTenant} disabled={isLoading}>
              Create Test Tenant
            </Button>
            <Button onClick={testGetTenants} disabled={isLoading}>
              Get My Tenants
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          {isLoading && (
            <Badge variant="secondary">Testing...</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                  {result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
