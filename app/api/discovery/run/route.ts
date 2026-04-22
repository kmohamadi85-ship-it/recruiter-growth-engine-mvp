import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCandidatesForMission, generateMockCandidates } from '@/lib/discovery'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user.id).single()
  if (!profile?.agency_id) return NextResponse.json({ error: 'No agency' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const { missionId } = body

  let missions
  if (missionId) {
    const { data } = await supabase.from('talent_missions').select('*').eq('id', missionId).eq('status', 'active').single()
    missions = data ? [data] : []
  } else {
    const { data } = await supabase.from('talent_missions').select('*').eq('agency_id', profile.agency_id).eq('status', 'active')
    missions = data || []
  }

  if (missions.length === 0) {
    return NextResponse.json({ count: 0, message: 'No active missions found' })
  }

  let totalCount = 0

  for (const mission of missions) {
    try {
      const candidatesPerMission = missionId ? 8 : 5
      const generated = process.env.OPENAI_API_KEY
        ? await generateCandidatesForMission(mission, candidatesPerMission)
        : generateMockCandidates(mission, candidatesPerMission)

      for (const gen of generated) {
        const { data: candidate, error: candError } = await supabase
          .from('candidates')
          .insert({
            agency_id: profile.agency_id,
            name: gen.name,
            current_role: gen.current_role,
            location: gen.location,
            skills: gen.skills,
            experience_years: gen.experience_years,
            summary: gen.summary,
            ai_profile_summary: gen.ai_profile_summary,
          })
          .select()
          .single()

        if (candError || !candidate) continue

        await supabase.from('candidate_mission_links').insert({
          candidate_id: candidate.id,
          mission_id: mission.id,
          match_score: gen.match_score,
          match_explanation: gen.match_explanation,
          status: 'discovered',
          pipeline_stage: 'Discovered',
        })

        totalCount++
      }
    } catch (err) {
      console.error(`Discovery failed for mission ${mission.id}:`, err)
    }
  }

  return NextResponse.json({ count: totalCount, missions: missions.length })
}
