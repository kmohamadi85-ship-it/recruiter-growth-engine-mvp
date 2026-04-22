import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Target, Users, TrendingUp, DollarSign, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/login')

  const { data: missions } = await supabase
    .from('talent_missions')
    .select('id, title, status, created_at')
    .eq('agency_id', profile.agency_id)

  const { data: allLinks } = await supabase
    .from('candidate_mission_links')
    .select('mission_id, status, pipeline_stage, discovered_at, candidates(name, current_role)')
    .in('mission_id', (missions || []).map(m => m.id))
    .order('discovered_at', { ascending: false })

  const links = allLinks || []
  const activeMissions = (missions || []).filter(m => m.status === 'active').length
  const totalDiscovered = links.length
  const totalApproved = links.filter(l => l.status === 'approved').length
  const pipelineOpps = links.filter(l => ['Approved', 'Contacted', 'Interview', 'Client Review', 'Offer'].includes(l.pipeline_stage)).length
  const placed = links.filter(l => l.pipeline_stage === 'Placed').length
  const estimatedValue = pipelineOpps * 15000

  const missionStats = (missions || []).map(mission => {
    const mLinks = links.filter(l => l.mission_id === mission.id)
    return {
      ...mission,
      discovered: mLinks.length,
      approved: mLinks.filter(l => l.status === 'approved').length,
      rate: mLinks.length > 0 ? Math.round((mLinks.filter(l => l.status === 'approved').length / mLinks.length) * 100) : 0,
    }
  }).sort((a, b) => b.discovered - a.discovered)

  const recentActivity = links.slice(0, 10)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
          Growth Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Your agency&apos;s talent pipeline at a glance</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Active Missions', value: activeMissions, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Discovered', value: totalDiscovered, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Approved', value: totalApproved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'In Pipeline', value: pipelineOpps, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Est. Value', value: `£${(estimatedValue / 1000).toFixed(0)}k`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mission Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {missionStats.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No missions yet</p>
            ) : (
              <div className="space-y-3">
                {missionStats.map(mission => (
                  <div key={mission.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{mission.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${mission.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-xs text-gray-500">{mission.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm ml-4">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">{mission.discovered}</div>
                        <div className="text-xs text-gray-400">found</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{mission.approved}</div>
                        <div className="text-xs text-gray-400">approved</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-indigo-600">{mission.rate}%</div>
                        <div className="text-xs text-gray-400">rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((link, i) => {
                  const candidate = link.candidates as { name?: string; current_role?: string } | null
                  return (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-semibold flex-shrink-0">
                        {(candidate?.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{candidate?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{candidate?.current_role}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          link.status === 'approved' ? 'bg-green-100 text-green-700' :
                          link.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{link.status}</span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(link.discovered_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
