import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MissionStatusToggle } from '@/components/mission-status-toggle'
import { CandidateCard } from '@/components/candidate-card'
import { RunDiscoveryButton } from '@/components/run-discovery-button'
import { ArrowLeft, MapPin, Briefcase, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Candidate, CandidateMissionLink } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mission } = await supabase
    .from('talent_missions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!mission) notFound()

  const { data: links } = await supabase
    .from('candidate_mission_links')
    .select('*, candidates(*)')
    .eq('mission_id', mission.id)
    .order('match_score', { ascending: false })

  const validLinks = (links || []).filter(l => l.candidates)

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/missions">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{mission.title}</h1>
            <Badge variant={mission.status === 'active' ? 'default' : 'secondary'}>{mission.status}</Badge>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Created {formatDistanceToNow(new Date(mission.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunDiscoveryButton missionId={mission.id} />
          <MissionStatusToggle missionId={mission.id} currentStatus={mission.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><MapPin className="h-4 w-4" />Location</div>
            <p className="font-medium">{mission.location || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><Briefcase className="h-4 w-4" />Seniority</div>
            <p className="font-medium">{mission.seniority || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><Tag className="h-4 w-4" />Industry</div>
            <p className="font-medium">{mission.industry || '—'}</p>
          </CardContent>
        </Card>
      </div>

      {mission.skills.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Required Skills</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mission.skills.map((skill: string) => (
                <span key={skill} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">{skill}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Candidates <span className="text-gray-400 font-normal text-base">({validLinks.length})</span>
        </h2>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>{validLinks.filter(l => l.status === 'approved').length} approved</span>
          <span>{validLinks.filter(l => l.status === 'rejected').length} rejected</span>
        </div>
      </div>

      {validLinks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500 mb-4">No candidates discovered yet</p>
          <RunDiscoveryButton missionId={mission.id} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {validLinks.map(link => (
            <CandidateCard
              key={link.id}
              candidate={link.candidates as Candidate}
              link={link as CandidateMissionLink}
              mission={mission}
            />
          ))}
        </div>
      )}
    </div>
  )
}
