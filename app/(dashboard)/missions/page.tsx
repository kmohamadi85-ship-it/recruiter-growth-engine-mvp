import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MissionStatusToggle } from '@/components/mission-status-toggle'
import { Target, Plus, MapPin, Briefcase, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function MissionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/login')

  const { data: missions } = await supabase
    .from('talent_missions')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })

  const { data: linkCounts } = await supabase
    .from('candidate_mission_links')
    .select('mission_id, status')
    .in('mission_id', (missions || []).map(m => m.id))

  function getCounts(missionId: string) {
    const mLinks = (linkCounts || []).filter(l => l.mission_id === missionId)
    return {
      total: mLinks.length,
      approved: mLinks.filter(l => l.status === 'approved').length,
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-600" />
            Talent Missions
          </h1>
          <p className="text-gray-500 mt-1">Define what you&apos;re hiring for — AI does the rest</p>
        </div>
        <Link href="/missions/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Mission
          </Button>
        </Link>
      </div>

      {(!missions || missions.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No missions yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm">Create your first Talent Mission to start AI-powered candidate discovery.</p>
          <Link href="/missions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Mission
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {missions.map((mission) => {
            const counts = getCounts(mission.id)
            return (
              <Card key={mission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/missions/${mission.id}`} className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                        {mission.title}
                      </h3>
                    </Link>
                    <Badge variant={mission.status === 'active' ? 'default' : 'secondary'} className="ml-2 flex-shrink-0">
                      {mission.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    {mission.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{mission.location}</span>
                    )}
                    {mission.seniority && (
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{mission.seniority}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(mission.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {mission.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mission.skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-md">{skill}</span>
                      ))}
                      {mission.skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md">+{mission.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-3 mt-3">
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">{counts.total} discovered</span>
                      <span className="text-green-600 font-medium">{counts.approved} approved</span>
                    </div>
                    <MissionStatusToggle missionId={mission.id} currentStatus={mission.status} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
