import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OutreachGenerator } from '@/components/outreach-generator'
import { ArrowLeft, MapPin, Briefcase, Star, Sparkles, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: link } = await supabase
    .from('candidate_mission_links')
    .select('*, candidates(*), talent_missions(*)')
    .eq('id', params.id)
    .single()

  if (!link?.candidates) notFound()

  const candidate = link.candidates as Record<string, unknown>
  const mission = link.talent_missions as Record<string, unknown>

  const { data: outreachDraft } = await supabase
    .from('outreach_drafts')
    .select('*')
    .eq('candidate_id', candidate.id as string)
    .eq('mission_id', mission.id as string)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  function getScoreColor(score: number) {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-orange-100 text-orange-700 border-orange-200'
  }

  function getInitials(name: string) {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <span className="text-gray-400 text-sm">Discovery Feed</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 text-sm font-medium">{candidate.name as string}</span>
      </div>

      {/* Hero */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {getInitials(candidate.name as string)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{candidate.name as string}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${getScoreColor(link.match_score)}`}>
              <Star className="h-4 w-4" />
              {link.match_score} match
            </span>
          </div>
          <p className="text-gray-600 mb-2">{candidate.current_role as string}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {candidate.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{candidate.location as string}</span>}
            {candidate.experience_years && <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{candidate.experience_years as number} years experience</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={link.status === 'approved' ? 'default' : link.status === 'rejected' ? 'destructive' : 'secondary'}>
            {link.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          {candidate.ai_profile_summary && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  AI Profile Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-900 leading-relaxed">{candidate.ai_profile_summary as string}</p>
              </CardContent>
            </Card>
          )}

          {/* Match Explanation */}
          {link.match_explanation && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-700">Why This Match?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{link.match_explanation}</p>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{(candidate.current_role as string)?.split(' at ')[0]}</p>
                  <p className="text-xs text-gray-500">{(candidate.current_role as string)?.split(' at ')[1] || 'Current Company'}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Clock className="h-3 w-3" />
                    ~{candidate.experience_years as number} years total experience
                  </div>
                </div>
              </div>
              {candidate.summary && (
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t leading-relaxed">{candidate.summary as string}</p>
              )}
            </CardContent>
          </Card>

          {/* Outreach */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Outreach Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <OutreachGenerator
                candidateId={candidate.id as string}
                linkId={link.id}
                missionId={mission.id as string}
                existingDraft={outreachDraft || null}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Skills */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {((candidate.skills as string[]) || []).map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">{skill}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mission */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-700">Matched Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/missions/${mission.id as string}`} className="text-sm text-indigo-600 hover:underline font-medium">
                {mission.title as string}
              </Link>
              {mission.seniority && <p className="text-xs text-gray-500 mt-1">{mission.seniority as string}</p>}
              {mission.industry && <p className="text-xs text-gray-500">{mission.industry as string}</p>}
            </CardContent>
          </Card>

          {/* Actions */}
          {link.status === 'discovered' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-700">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <form action={`/api/candidates/${link.id}/approve`} method="POST">
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Approve Candidate</Button>
                </form>
                <form action={`/api/candidates/${link.id}/reject`} method="POST">
                  <Button type="submit" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">Reject</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
