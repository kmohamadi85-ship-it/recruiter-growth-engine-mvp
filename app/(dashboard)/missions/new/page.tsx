'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { X, Plus, ArrowLeft, Target } from 'lucide-react'
import { SENIORITY_OPTIONS, INDUSTRY_OPTIONS } from '@/lib/types'

export default function NewMissionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [seniority, setSeniority] = useState('')
  const [industry, setIndustry] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  function addSkill(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = skillInput.trim().replace(/,$/, '')
      if (val && !skills.includes(val)) setSkills(prev => [...prev, val])
      setSkillInput('')
    }
  }

  function addKeyword(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = keywordInput.trim().replace(/,$/, '')
      if (val && !keywords.includes(val)) setKeywords(prev => [...prev, val])
      setKeywordInput('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, skills, location, seniority, industry, keywords, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'Mission created', description: 'AI discovery will begin shortly.' })
      router.push('/missions')
    } catch (err) {
      toast({ title: 'Failed to create mission', description: err instanceof Error ? err.message : undefined, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/missions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600" />
            New Talent Mission
          </h1>
          <p className="text-gray-500 mt-0.5">Define the role — AI will discover candidates automatically</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Senior Full-Stack Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seniority">Seniority Level</Label>
                <Select value={seniority} onValueChange={setSeniority}>
                  <SelectTrigger id="seniority" className="mt-1">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {SENIORITY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger id="industry" className="mt-1">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. London, UK or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Required Skills</Label>
              <div className="mt-1 flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring">
                {skills.map(skill => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-md">
                    {skill}
                    <button type="button" onClick={() => setSkills(s => s.filter(x => x !== skill))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  placeholder={skills.length === 0 ? 'Type a skill and press Enter…' : 'Add more…'}
                  className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add</p>
            </div>

            <div>
              <Label>Keywords</Label>
              <div className="mt-1 flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-sm rounded-md">
                    {kw}
                    <button type="button" onClick={() => setKeywords(k => k.filter(x => x !== kw))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={addKeyword}
                  placeholder={keywords.length === 0 ? 'e.g. startup, fintech, b2b…' : 'Add more…'}
                  className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any specific requirements, nice-to-haves, or context for the AI…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" disabled={loading} className="gap-2">
            <Plus className="h-4 w-4" />
            {loading ? 'Creating…' : 'Create Mission'}
          </Button>
          <Link href="/missions">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
