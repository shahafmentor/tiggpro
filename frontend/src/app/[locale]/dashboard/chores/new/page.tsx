'use client'

import { useLocalizedRouter } from '@/hooks/use-localized-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateChoreForm } from '@/components/chores/create-chore-form'
import { useTenant } from '@/lib/contexts/tenant-context'
import { PageHeader } from '@/components/layout/page-header'
import { useCommonTranslations, usePagesTranslations } from '@/hooks/use-translations'

export default function NewChorePage() {
  const router = useLocalizedRouter()
  const queryClient = useQueryClient()
  const { currentTenant } = useTenant()
  const c = useCommonTranslations()
  const p = usePagesTranslations()

  const handleSuccess = () => {
    // Invalidate chores query to refetch updated data
    if (currentTenant) {
      queryClient.invalidateQueries({ queryKey: ['chores', currentTenant.tenant.id] })
    }
    router.push('/dashboard/chores')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {c('back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{p('choresNew.title')}</h1>
          <p className="text-muted-foreground">
            {p('choresNew.subtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <CreateChoreForm onSuccess={handleSuccess} />
    </div>
  )
}
