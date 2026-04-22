'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface MissionStatusToggleProps {
  missionId: string
  currentStatus: 'active' | 'paused'
}

export function MissionStatusToggle({ missionId, currentStatus }: MissionStatusToggleProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function toggle() {
    setLoading(true)
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch(`/api/missions/${missionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      router.refresh()
      toast({ title: `Mission ${newStatus === 'active' ? 'activated' : 'paused'}` })
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {currentStatus === 'active' ? 'Pause' : 'Activate'}
    </Button>
  )
}
