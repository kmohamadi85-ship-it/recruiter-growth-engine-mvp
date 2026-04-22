export interface Agency {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  agency_id: string | null
  email: string
  full_name: string | null
  role: 'owner' | 'recruiter'
  avatar_url: string | null
  created_at: string
}

export interface TalentMission {
  id: string
  agency_id: string
  created_by: string
  title: string
  skills: string[]
  location: string | null
  seniority: string | null
  industry: string | null
  keywords: string[]
  notes: string | null
  status: 'active' | 'paused'
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  agency_id: string
  name: string
  current_role: string | null
  location: string | null
  skills: string[]
  experience_years: number | null
  summary: string | null
  ai_profile_summary: string | null
  linkedin_url: string | null
  created_at: string
}

export interface CandidateMissionLink {
  id: string
  candidate_id: string
  mission_id: string
  match_score: number
  status: 'discovered' | 'approved' | 'rejected'
  pipeline_stage: string
  match_explanation: string | null
  discovered_at: string
  updated_at: string
}

export interface OutreachDraft {
  id: string
  candidate_id: string
  mission_id: string
  created_by: string
  intro_message: string | null
  followup_message: string | null
  interview_invite: string | null
  created_at: string
}

export interface Invitation {
  id: string
  agency_id: string
  invited_by: string
  email: string
  token: string
  accepted: boolean
  created_at: string
}

// Extended types with joins
export interface CandidateWithLink extends Candidate {
  candidate_mission_links: CandidateMissionLink[]
}

export interface CandidateMissionLinkWithDetails extends CandidateMissionLink {
  candidates: Candidate
  talent_missions: TalentMission
}

export interface MissionWithStats extends TalentMission {
  candidate_count?: number
  approved_count?: number
  rejected_count?: number
}

export interface GeneratedCandidate {
  name: string
  current_role: string
  location: string
  skills: string[]
  experience_years: number
  summary: string
  ai_profile_summary: string
  match_score: number
  match_explanation: string
}

export const PIPELINE_STAGES = [
  'Discovered',
  'Approved',
  'Contacted',
  'Interview',
  'Client Review',
  'Offer',
  'Placed',
] as const

export type PipelineStage = typeof PIPELINE_STAGES[number]

export const SENIORITY_OPTIONS = [
  'Junior',
  'Mid',
  'Senior',
  'Lead',
  'Principal',
  'Executive',
] as const

export const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Marketing',
  'Sales',
  'Engineering',
  'Design',
  'Other',
] as const
