'use client'

import { useState } from 'react'
import { Copy, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

interface OutreachGeneratorProps {
  candidateId: string
  linkId: string
  missionId: string
  existingDraft?: {
    intro_message: string | null
    followup_message: string | null
    interview_invite: string | null
  } | null
}

export function OutreachGenerator({ candidateId, linkId, missionId, existingDraft }: OutreachGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState(existingDraft)
  const [copied, setCopied] = useState<string | null>(null)
  const { toast } = useToast()

  async function generateOutreach() {
    setLoading(true)
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, linkId, missionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDraft(data)
      toast({ title: 'Outreach messages generated' })
    } catch (err) {
      toast({ title: 'Generation failed', description: err instanceof Error ? err.message : undefined, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
    toast({ title: 'Copied to clipboard' })
  }

  if (!draft) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-6 w-6 text-indigo-600" />
        </div>
        <h3 className="font-medium text-gray-900 mb-2">Generate Outreach Messages</h3>
        <p className="text-sm text-gray-500 mb-4">AI will create personalised messages based on the candidate profile and role</p>
        <Button onClick={generateOutreach} disabled={loading} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {loading ? 'Generating…' : 'Generate Messages'}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Outreach Messages</h3>
        <Button variant="outline" size="sm" onClick={generateOutreach} disabled={loading} className="gap-2">
          <Sparkles className="h-3 w-3" />
          {loading ? 'Regenerating…' : 'Regenerate'}
        </Button>
      </div>
      <Tabs defaultValue="intro">
        <TabsList className="mb-4">
          <TabsTrigger value="intro">Intro Message</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="interview">Interview Invite</TabsTrigger>
        </TabsList>
        {([
          { key: 'intro', label: 'Intro Message', content: draft.intro_message },
          { key: 'followup', label: 'Follow-up', content: draft.followup_message },
          { key: 'interview', label: 'Interview Invite', content: draft.interview_invite },
        ] as const).map(({ key, content }) => (
          <TabsContent key={key} value={key}>
            <div className="relative">
              <Textarea
                value={content || ''}
                onChange={() => {}}
                className="min-h-[200px] font-mono text-sm resize-none pr-12"
                readOnly
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => content && copyText(content, key)}
              >
                {copied === key ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
