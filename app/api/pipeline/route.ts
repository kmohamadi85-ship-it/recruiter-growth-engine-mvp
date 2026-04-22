import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { linkId, stage } = await request.json()
  if (!linkId || !stage) return NextResponse.json({ error: 'linkId and stage required' }, { status: 400 })

  const { data, error } = await supabase
    .from('candidate_mission_links')
    .update({ pipeline_stage: stage })
    .eq('id', linkId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
