'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface RunDiscoveryButtonProps {
  missionId?: string
}

export function RunDiscoveryButton({ missionId }: RunDiscoveryButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleRun() {
    setLoading(true)
    try {
      const res = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Discovery complete',
          description: `${data.count} new candidates discovered`,
        })
        router.refresh()
      } else {
        throw new Error(data.error || 'Discovery failed')
      }
    } catch (err) {
      toast({
        title: 'Discovery failed',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRun} disabled={loading} className="gap-2">
      <Sparkles className="h-4 w-4" />
      {loading ? 'Running AI Discovery…' : 'Run AI Discovery'}
    </Button>
  )
}
