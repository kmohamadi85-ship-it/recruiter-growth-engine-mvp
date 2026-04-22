import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CandidateCard } from '@/components/candidate-card'
import { RunDiscoveryButton } from '@/components/run-discovery-button'
import { Sparkles, Users, Zap } from 'lucide-react'
import type { Candidate, CandidateMissionLink, TalentMission } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DiscoveryFeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No agency found</h2>
          <p className="text-gray-500">Please contact support.</p>
        </div>
      </div>
    )
  }

  const { data: missionRows } = await supabase
    .from('talent_missions')
    .select('id')
    .eq('agency_id', profile.agency_id)

  const missionIds = (missionRows || []).map(m => m.id)

  const { data: links } = missionIds.length > 0
    ? await supabase
        .from('candidate_mission_links')
        .select('*, candidates (*), talent_missions (*)')
        .in('mission_id', missionIds)
        .order('discovered_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const validLinks = (links || []).filter(l => l.candidates && l.talent_missions)

  const discovered = validLinks.filter(l => l.status === 'discovered')
  const approved = validLinks.filter(l => l.status === 'approved')
  const rejected = validLinks.filter(l => l.status === 'rejected')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Discovery Feed
          </h1>
          <p className="text-gray-500 mt-1">AI-discovered candidates for your active missions</p>
        </div>
        <RunDiscoveryButton />
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-8">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">New</span>
          <span className="font-semibold text-gray-900">{discovered.length}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Approved</span>
          <span className="font-semibold text-gray-900">{approved.length}</span>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-lg px-4 py-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span className="text-gray-600">Rejected</span>
          <span className="font-semibold text-gray-900">{rejected.length}</span>
        </div>
      </div>

      {/* Feed */}
      {validLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            Create a Talent Mission and run AI Discovery to start finding candidates automatically.
          </p>
          <div className="flex gap-3">
            <a href="/missions/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              <Users className="h-4 w-4" />
              Create Mission
            </a>
            <RunDiscoveryButton />
          </div>
        </div>
      ) : (
        <>
          {discovered.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">New Discoveries</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {discovered.map((link) => (
                  <CandidateCard
                    key={link.id}
                    candidate={link.candidates as Candidate}
                    link={link as CandidateMissionLink}
                    mission={link.talent_missions as TalentMission}
                  />
                ))}
              </div>
            </section>
          )}
          {approved.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Approved</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {approved.map((link) => (
                  <CandidateCard
                    key={link.id}
                    candidate={link.candidates as Candidate}
                    link={link as CandidateMissionLink}
                    mission={link.talent_missions as TalentMission}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
