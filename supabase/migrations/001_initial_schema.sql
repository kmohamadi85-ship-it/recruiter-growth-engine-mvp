-- Recruiter Growth Engine - Initial Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- AGENCIES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'recruiter' CHECK (role IN ('owner', 'recruiter')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- TALENT MISSIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS talent_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  seniority TEXT,
  industry TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- CANDIDATES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_role TEXT,
  location TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER,
  summary TEXT,
  ai_profile_summary TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- CANDIDATE MISSION LINKS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS candidate_mission_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES talent_missions(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
  status TEXT NOT NULL DEFAULT 'discovered' CHECK (status IN ('discovered', 'approved', 'rejected')),
  pipeline_stage TEXT NOT NULL DEFAULT 'Discovered',
  match_explanation TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, mission_id)
);

-- =====================
-- OUTREACH DRAFTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES talent_missions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  intro_message TEXT,
  followup_message TEXT,
  interview_invite TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- INVITATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_talent_missions_updated_at
  BEFORE UPDATE ON talent_missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_mission_links_updated_at
  BEFORE UPDATE ON candidate_mission_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- HANDLE NEW USER TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_mission_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can read profiles in their agency"
  ON profiles FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- AGENCIES policies
CREATE POLICY "Agency members can read their agency"
  ON agencies FOR SELECT
  USING (
    id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their agency"
  ON agencies FOR UPDATE
  USING (
    id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- TALENT MISSIONS policies
CREATE POLICY "Agency members can read missions"
  ON talent_missions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency members can create missions"
  ON talent_missions FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency members can update missions"
  ON talent_missions FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency members can delete missions"
  ON talent_missions FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- CANDIDATES policies
CREATE POLICY "Agency members can read candidates"
  ON candidates FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency members can create candidates"
  ON candidates FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency members can update candidates"
  ON candidates FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- CANDIDATE MISSION LINKS policies
CREATE POLICY "Agency members can read links"
  ON candidate_mission_links FOR SELECT
  USING (
    mission_id IN (
      SELECT id FROM talent_missions WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Agency members can create links"
  ON candidate_mission_links FOR INSERT
  WITH CHECK (
    mission_id IN (
      SELECT id FROM talent_missions WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Agency members can update links"
  ON candidate_mission_links FOR UPDATE
  USING (
    mission_id IN (
      SELECT id FROM talent_missions WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Agency members can delete links"
  ON candidate_mission_links FOR DELETE
  USING (
    mission_id IN (
      SELECT id FROM talent_missions WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- OUTREACH DRAFTS policies
CREATE POLICY "Agency members can read outreach"
  ON outreach_drafts FOR SELECT
  USING (
    mission_id IN (
      SELECT id FROM talent_missions WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Agency members can create outreach"
  ON outreach_drafts FOR INSERT
  WITH CHECK (
    mission_id IN (
      SELECT id FROM talent_missions WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Agency members can update outreach"
  ON outreach_drafts FOR UPDATE
  USING (
    mission_id IN (
      SELECT id FROM talent_missions WHERE agency_id IN (
        SELECT agency_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- INVITATIONS policies
CREATE POLICY "Agency owners can read invitations"
  ON invitations FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Agency owners can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- =====================
-- SEED DATA EXAMPLES
-- =====================
-- Example agency:
-- INSERT INTO agencies (name, slug) VALUES ('Apex Talent Group', 'apex-talent-group');
--
-- Example mission:
-- INSERT INTO talent_missions (agency_id, created_by, title, skills, location, seniority, industry, keywords)
-- VALUES (
--   '<agency_id>',
--   '<profile_id>',
--   'Senior Full-Stack Engineer - FinTech',
--   ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
--   'London, UK',
--   'Senior',
--   'Finance',
--   ARRAY['fintech', 'payments', 'startup']
-- );
--
-- Example candidate:
-- INSERT INTO candidates (agency_id, name, current_role, location, skills, experience_years, summary)
-- VALUES (
--   '<agency_id>',
--   'Sarah Chen',
--   'Senior Software Engineer at Revolut',
--   'London, UK',
--   ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
--   6,
--   'Experienced full-stack engineer specializing in fintech payments infrastructure.'
-- );
