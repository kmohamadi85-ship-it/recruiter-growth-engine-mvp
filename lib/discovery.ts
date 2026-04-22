import { openai } from '@/lib/openai'
import type { TalentMission, GeneratedCandidate } from '@/lib/types'

export async function generateCandidatesForMission(
  mission: TalentMission,
  count: number = 5
): Promise<GeneratedCandidate[]> {
  const prompt = `You are an AI talent sourcing engine. Generate ${count} realistic candidate profiles that would be a strong match for the following job brief.

Job Brief:
Title: ${mission.title}
Skills Required: ${mission.skills.join(', ')}
Location: ${mission.location || 'Flexible/Remote'}
Seniority: ${mission.seniority || 'Not specified'}
Industry: ${mission.industry || 'Not specified'}
Keywords: ${mission.keywords.join(', ')}
Additional Notes: ${mission.notes || 'None'}

Generate ${count} diverse, realistic candidate profiles. Each candidate should feel like a real person with a genuine career history.

Respond with ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "name": "Full Name",
    "current_role": "Current Job Title at Company Name",
    "location": "City, Country",
    "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "experience_years": 5,
    "summary": "2-3 sentence bio describing their background and what makes them interesting.",
    "ai_profile_summary": "Detailed AI analysis paragraph explaining why this candidate is relevant to this specific role, their key strengths, and potential fit.",
    "match_score": 85,
    "match_explanation": "Concise explanation of why this candidate scored this match percentage against the job requirements."
  }
]

Requirements:
- Make names diverse and realistic (mix of backgrounds)
- Current roles should be at real-sounding companies
- Skills should be relevant to the mission
- Match scores should vary between 55-95
- Summaries should be compelling and specific
- All profiles must be completely fictional`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    // Strip any potential markdown code blocks
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const candidates = JSON.parse(jsonStr) as GeneratedCandidate[]
    return candidates
  } catch (error) {
    console.error('OpenAI generation failed, falling back to mock:', error)
    return generateMockCandidates(mission, count)
  }
}

const FIRST_NAMES = [
  'Sarah', 'James', 'Priya', 'Marcus', 'Elena', 'David', 'Aisha', 'Tom',
  'Mei', 'Carlos', 'Fatima', 'Oliver', 'Yuki', 'Ben', 'Nadia', 'Alex',
  'Zoe', 'Raj', 'Sophie', 'Michael', 'Amara', 'Lucas', 'Claire', 'Hassan',
]

const LAST_NAMES = [
  'Chen', 'Thompson', 'Patel', 'Williams', 'Martinez', 'Johnson', 'Kim',
  'Anderson', 'Singh', 'Rodriguez', 'Brown', 'Taylor', 'Garcia', 'Miller',
  'Wilson', 'Davis', 'Lee', 'Jackson', 'White', 'Harris', 'Clark', 'Lewis',
  'Robinson', 'Walker', 'Hall', 'Young', 'Allen', 'Hernandez', 'King',
]

const COMPANIES = [
  'Google', 'Meta', 'Amazon', 'Microsoft', 'Stripe', 'Shopify', 'Airbnb',
  'Uber', 'Revolut', 'Monzo', 'Spotify', 'Notion', 'Figma', 'Vercel',
  'Datadog', 'Snowflake', 'Palantir', 'Salesforce', 'HubSpot', 'Atlassian',
  'Twilio', 'SendGrid', 'Cloudflare', 'HashiCorp', 'Confluent', 'dbt Labs',
  'Intercom', 'Zendesk', 'Okta', 'Auth0', 'Segment', 'Mixpanel',
]

const CITIES = [
  'London, UK', 'New York, USA', 'San Francisco, USA', 'Berlin, Germany',
  'Amsterdam, Netherlands', 'Toronto, Canada', 'Sydney, Australia',
  'Singapore', 'Dublin, Ireland', 'Stockholm, Sweden', 'Paris, France',
  'Barcelona, Spain', 'Austin, USA', 'Seattle, USA', 'Chicago, USA',
  'Melbourne, Australia', 'Copenhagen, Denmark', 'Zurich, Switzerland',
]

const ROLE_TEMPLATES: Record<string, string[]> = {
  engineering: [
    'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
    'Engineering Manager', 'Lead Backend Engineer', 'Full-Stack Developer',
    'Platform Engineer', 'DevOps Engineer', 'Site Reliability Engineer',
  ],
  product: [
    'Senior Product Manager', 'Product Lead', 'Director of Product',
    'Group Product Manager', 'Principal PM', 'Head of Product',
  ],
  design: [
    'Senior UX Designer', 'Product Designer', 'Lead Designer',
    'UX Research Lead', 'Design Manager', 'Head of Design',
  ],
  data: [
    'Senior Data Scientist', 'Machine Learning Engineer', 'Data Engineer',
    'Analytics Lead', 'AI Research Scientist', 'MLOps Engineer',
  ],
  marketing: [
    'Growth Marketing Manager', 'Head of Marketing', 'Performance Marketing Lead',
    'Brand Director', 'Content Strategy Lead', 'CMO',
  ],
  sales: [
    'Account Executive', 'Sales Manager', 'VP of Sales',
    'Enterprise Sales Director', 'Business Development Lead', 'SDR Manager',
  ],
  finance: [
    'Finance Manager', 'FP&A Lead', 'CFO', 'Head of Finance',
    'Financial Controller', 'VP Finance',
  ],
}

const SKILL_POOLS: Record<string, string[]> = {
  engineering: ['React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust', 'PostgreSQL', 'AWS', 'GCP', 'Kubernetes', 'Docker', 'GraphQL', 'REST APIs', 'Redis', 'MongoDB', 'Terraform', 'CI/CD', 'Microservices'],
  product: ['Product Strategy', 'Roadmapping', 'A/B Testing', 'User Research', 'Data Analysis', 'Agile', 'Jira', 'OKRs', 'Market Analysis', 'Stakeholder Management'],
  design: ['Figma', 'UI/UX Design', 'Design Systems', 'User Research', 'Prototyping', 'Accessibility', 'Motion Design', 'Brand Design'],
  data: ['Python', 'SQL', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Spark', 'Airflow', 'dbt', 'Tableau', 'Looker', 'Statistics'],
  marketing: ['SEO', 'SEM', 'Content Marketing', 'Email Marketing', 'HubSpot', 'Analytics', 'Social Media', 'Brand Strategy', 'Copywriting'],
  sales: ['Salesforce', 'HubSpot CRM', 'B2B Sales', 'Enterprise Sales', 'Pipeline Management', 'Negotiation', 'Outbound', 'Cold Outreach'],
  finance: ['Financial Modeling', 'Excel', 'SQL', 'FP&A', 'Budgeting', 'Forecasting', 'IFRS', 'GAAP', 'Tableau'],
}

function detectCategory(mission: TalentMission): string {
  const text = `${mission.title} ${mission.skills.join(' ')} ${mission.industry || ''}`.toLowerCase()
  if (text.match(/engineer|developer|software|backend|frontend|devops|platform|sre/)) return 'engineering'
  if (text.match(/product manager|pm |product lead/)) return 'product'
  if (text.match(/design|ux|ui |figma/)) return 'design'
  if (text.match(/data|machine learning|ml |ai |analytics/)) return 'data'
  if (text.match(/marketing|growth|brand|content/)) return 'marketing'
  if (text.match(/sales|account exec|business dev|sdr/)) return 'sales'
  if (text.match(/finance|financial|cfo|fp&a/)) return 'finance'
  return 'engineering'
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

export function generateMockCandidates(mission: TalentMission | Record<string, unknown>, count: number): GeneratedCandidate[] {
  const m = mission as TalentMission
  const category = detectCategory(m)
  const roles = ROLE_TEMPLATES[category] || ROLE_TEMPLATES.engineering
  const skillPool = SKILL_POOLS[category] || SKILL_POOLS.engineering

  // Include mission skills in the pool
  const missionSkills = m.skills || []
  const combinedSkills = [...new Set([...missionSkills, ...skillPool])]

  const candidates: GeneratedCandidate[] = []

  for (let i = 0; i < count; i++) {
    const firstName = pickRandom(FIRST_NAMES)
    const lastName = pickRandom(LAST_NAMES)
    const name = `${firstName} ${lastName}`
    const company = pickRandom(COMPANIES)
    const role = pickRandom(roles)
    const currentRole = `${role} at ${company}`
    const location = m.location || pickRandom(CITIES)
    const expYears = Math.floor(Math.random() * 10) + 3
    const candidateSkills = pickRandomN(combinedSkills, Math.min(6, combinedSkills.length))
    const matchScore = Math.floor(Math.random() * 35) + 58

    const summary = `${firstName} is a ${role.toLowerCase()} with ${expYears} years of experience in ${category}. ` +
      `Currently at ${company}, they have built expertise in ${candidateSkills.slice(0, 3).join(', ')}. ` +
      `Known for delivering high-impact projects and collaborating with cross-functional teams.`

    const aiProfileSummary = `This candidate presents a strong profile for the ${m.title} role. ` +
      `With ${expYears} years of hands-on experience and demonstrated expertise in ${candidateSkills.slice(0, 4).join(', ')}, ` +
      `they align well with the core requirements. Their background at ${company} suggests exposure to the scale and complexity ` +
      `you're looking for. ${firstName} shows particular strength in the technical areas most critical to this mission, ` +
      `and their career trajectory indicates they are actively seeking the type of challenge this role offers.`

    const matchExplanation = `Scored ${matchScore}/100 based on ${Math.floor(missionSkills.filter(s => candidateSkills.map(c => c.toLowerCase()).includes(s.toLowerCase())).length)} of ${missionSkills.length} required skills matched, ` +
      `${expYears >= 5 ? 'meets' : 'near'} experience threshold, and location ${location.includes(m.location || '') ? 'match' : 'consideration'}.`

    candidates.push({
      name,
      current_role: currentRole,
      location,
      skills: candidateSkills,
      experience_years: expYears,
      summary,
      ai_profile_summary: aiProfileSummary,
      match_score: matchScore,
      match_explanation: matchExplanation,
    })
  }

  return candidates
}
