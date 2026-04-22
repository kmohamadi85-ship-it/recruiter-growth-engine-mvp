import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai'

async function generateOutreachMessages(candidateName: string, candidateRole: string, missionTitle: string, skills: string[]) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      intro_message: `Hi ${candidateName},\n\nI came across your profile and was really impressed by your background as ${candidateRole}. We're working on an exciting ${missionTitle} opportunity that I think could be a great fit for your skills in ${skills.slice(0, 3).join(', ')}.\n\nWould you be open to a quick 15-minute chat to explore this further?\n\nBest regards`,
      followup_message: `Hi ${candidateName},\n\nI wanted to follow up on my previous message about the ${missionTitle} role. I genuinely think your experience would be a strong match for what we're looking for.\n\nAre you available for a brief call this week?\n\nBest regards`,
      interview_invite: `Hi ${candidateName},\n\nThank you for your interest in the ${missionTitle} position! I'd love to invite you for a formal interview to learn more about your experience and share details about the role.\n\nWould you be available for a 45-minute video call? Please let me know your availability and I'll send over a calendar invite.\n\nLooking forward to speaking with you!\n\nBest regards`,
    }
  }

  const prompt = `Generate 3 professional recruitment outreach messages for a recruiter reaching out to a candidate.

Candidate: ${candidateName}
Current Role: ${candidateRole}
Job Opening: ${missionTitle}
Key Skills: ${skills.join(', ')}

Generate:
1. intro_message: A warm, personalised initial outreach (3-4 sentences, not salesy, genuine interest)
2. followup_message: A brief, friendly follow-up if no response (2-3 sentences)
3. interview_invite: A formal interview invitation (3-4 sentences)

Return ONLY valid JSON with keys: intro_message, followup_message, interview_invite. No markdown.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    })
    const content = response.choices[0]?.message?.content || '{}'
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return {
      intro_message: `Hi ${candidateName}, I came across your profile and think your background in ${skills[0]} would be a great fit for our ${missionTitle} role. Would you be open to a quick chat?`,
      followup_message: `Hi ${candidateName}, just following up on the ${missionTitle} opportunity — would love to connect if you have 15 minutes this week.`,
      interview_invite: `Hi ${candidateName}, we'd love to invite you for an interview for the ${missionTitle} role. Please let me know your availability for a 45-minute video call.`,
    }
  }
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidateId, linkId, missionId } = await request.json()

  const [{ data: candidate }, { data: mission }] = await Promise.all([
    supabase.from('candidates').select('*').eq('id', candidateId).single(),
    supabase.from('talent_missions').select('*').eq('id', missionId).single(),
  ])

  if (!candidate || !mission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const messages = await generateOutreachMessages(
    candidate.name,
    candidate.current_role || 'Professional',
    mission.title,
    candidate.skills || []
  )

  const { data: draft, error } = await supabase
    .from('outreach_drafts')
    .insert({
      candidate_id: candidateId,
      mission_id: missionId,
      created_by: user.id,
      intro_message: messages.intro_message,
      followup_message: messages.followup_message,
      interview_invite: messages.interview_invite,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(draft)
}
