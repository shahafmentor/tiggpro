'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateChoreForm } from '@/components/chores/create-chore-form'

export default function NewChorePage() {
  const router = useRouter()

  const handleSuccess = () => {
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
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Chore</h1>
          <p className="text-muted-foreground">
            Add a new chore for your family members to complete
          </p>
        </div>
      </div>

      {/* Form */}
      <CreateChoreForm onSuccess={handleSuccess} />
    </div>
  )
}
