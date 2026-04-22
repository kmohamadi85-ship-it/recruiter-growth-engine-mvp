'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Briefcase, Star, Check, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import type { Candidate, CandidateMissionLink, TalentMission } from '@/lib/types'

interface CandidateCardProps {
  candidate: Candidate
  link: CandidateMissionLink
  mission: TalentMission
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-700 border-green-200'
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-orange-100 text-orange-700 border-orange-200'
}

function getAvatarColor(score: number) {
  if (score >= 80) return 'bg-green-600'
  if (score >= 60) return 'bg-indigo-600'
  return 'bg-orange-500'
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function CandidateCard({ candidate, link, mission }: CandidateCardProps) {
  const [status, setStatus] = useState(link.status)
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      const res = await fetch(`/api/candidates/${link.id}/${action}`, { method: 'POST' })
      if (!res.ok) throw new Error()
      setStatus(action === 'approve' ? 'approved' : 'rejected')
      toast({ title: action === 'approve' ? 'Candidate approved' : 'Candidate rejected' })
      router.refresh()
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  const isActed = status !== 'discovered'

  return (
    <Card className={`relative transition-all hover:shadow-md ${isActed ? 'opacity-70' : ''}`}>
      {isActed && (
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold ${status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status === 'approved' ? '✓ Approved' : '✗ Rejected'}
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${getAvatarColor(link.match_score)}`}>
            {getInitials(candidate.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{candidate.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getScoreColor(link.match_score)}`}>
                <Star className="h-3 w-3" />
                {link.match_score}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{candidate.current_role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {candidate.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {candidate.location}
            </span>
          )}
          {candidate.experience_years && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {candidate.experience_years}y exp
            </span>
          )}
        </div>

        <Badge variant="secondary" className="text-xs mb-3">
          {mission.title}
        </Badge>

        {candidate.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {candidate.skills.slice(0, 4).map((skill) => (
              <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-md">
                {skill}
              </span>
            ))}
            {candidate.skills.length > 4 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md">
                +{candidate.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {candidate.summary && (
          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{candidate.summary}</p>
        )}

        <div className="flex items-center gap-2">
          {!isActed && (
            <>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 gap-1 text-xs"
                onClick={() => handleAction('approve')}
                disabled={!!loading}
              >
                <Check className="h-3 w-3" />
                {loading === 'approve' ? '…' : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-1 text-xs"
                onClick={() => handleAction('reject')}
                disabled={!!loading}
              >
                <X className="h-3 w-3" />
                {loading === 'reject' ? '…' : 'Reject'}
              </Button>
            </>
          )}
          <Link href={`/candidates/${link.id}`} className="flex-1">
            <Button size="sm" variant="ghost" className="w-full text-xs">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
