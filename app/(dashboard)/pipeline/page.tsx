import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PipelineBoard } from '@/components/pipeline-board'
import { Kanban } from 'lucide-react'
import type { Candidate, CandidateMissionLink, TalentMission } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/login')

  const { data: missionRows } = await supabase
    .from('talent_missions')
    .select('id')
    .eq('agency_id', profile.agency_id)

  const missionIds = (missionRows || []).map(m => m.id)

  const { data: links } = missionIds.length > 0
    ? await supabase
        .from('candidate_mission_links')
        .select('*, candidates(*), talent_missions(*)')
        .in('mission_id', missionIds)
        .neq('status', 'rejected')
        .order('updated_at', { ascending: false })
    : { data: [] }

  const items = (links || [])
    .filter(l => l.candidates && l.talent_missions)
    .map(l => ({
      candidate: l.candidates as Candidate,
      link: l as CandidateMissionLink,
      mission: l.talent_missions as TalentMission,
    }))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Kanban className="h-6 w-6 text-indigo-600" />
          Pipeline
        </h1>
        <p className="text-gray-500 mt-1">Drag candidates through your recruitment stages</p>
      </div>
      <PipelineBoard items={items} />
    </div>
  )
}
