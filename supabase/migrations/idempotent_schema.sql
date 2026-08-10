-- Enable RLS
-- First, create the profiles table which extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    household_role TEXT NOT NULL CHECK (household_role IN ('owner', 'co-owner', 'student')),
    linked_student_id UUID, -- Will add FK after students table is created
    display_name TEXT
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Add FK from profiles to students now that students table exists
ALTER TABLE profiles ADD CONSTRAINT fk_linked_student FOREIGN KEY (linked_student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Create academic_years table
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    year_label TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_state_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create daily_logs table (includes columns for later phases as nullable, to avoid altering later)
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    log_type TEXT NOT NULL,
    notes TEXT,
    pending_parent_approval BOOLEAN NOT NULL DEFAULT false,
    shared_activity_group_id UUID,
    unit_study_id UUID,
    trip_id UUID,
    google_event_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- Security Helpers
-- =========================================================================
-- Caching role lookups via functions
CREATE OR REPLACE FUNCTION get_user_role() RETURNS text AS $$
  SELECT household_role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_linked_student_id() RETURNS uuid AS $$
  SELECT linked_student_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =========================================================================
-- RLS Policies - Profiles
-- =========================================================================
CREATE POLICY "Parents have full access to profiles" 
    ON profiles FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view their own profile" 
    ON profiles FOR SELECT 
    USING (id = auth.uid());

-- =========================================================================
-- RLS Policies - Students
-- =========================================================================
CREATE POLICY "Parents have full access to students" 
    ON students FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view their own student record" 
    ON students FOR SELECT 
    USING (get_user_role() = 'student' AND id = get_linked_student_id());

-- =========================================================================
-- RLS Policies - Academic Years
-- =========================================================================
CREATE POLICY "Parents have full access to academic_years" 
    ON academic_years FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view their own academic years" 
    ON academic_years FOR SELECT 
    USING (get_user_role() = 'student' AND student_id = get_linked_student_id());

-- =========================================================================
-- RLS Policies - Subjects
-- =========================================================================
CREATE POLICY "Parents have full access to subjects" 
    ON subjects FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view all subjects" 
    ON subjects FOR SELECT 
    USING (get_user_role() = 'student');

-- =========================================================================
-- RLS Policies - Daily Logs
-- =========================================================================
CREATE POLICY "Parents have full access to daily_logs" 
    ON daily_logs FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view their own logs" 
    ON daily_logs FOR SELECT 
    USING (get_user_role() = 'student' AND student_id = get_linked_student_id());

-- The magic happens here: Student inserts are forced to have pending_parent_approval = true
-- If they try to insert with pending_parent_approval = false, the DB rejects it.
CREATE POLICY "Students can create logs but must flag as pending" 
    ON daily_logs FOR INSERT 
    WITH CHECK (
        get_user_role() = 'student' 
        AND student_id = get_linked_student_id() 
        AND pending_parent_approval = true
    );

CREATE POLICY "Students can update their own pending logs" 
    ON daily_logs FOR UPDATE 
    USING (
        get_user_role() = 'student' 
        AND student_id = get_linked_student_id()
    )
    WITH CHECK (
        get_user_role() = 'student' 
        AND student_id = get_linked_student_id() 
        AND pending_parent_approval = true
    );

CREATE POLICY "Students can delete their own pending logs" 
    ON daily_logs FOR DELETE 
    USING (
        get_user_role() = 'student' 
        AND student_id = get_linked_student_id()
        AND pending_parent_approval = true
    );
-- Trigger to automatically create a profile for a new user in auth.users
-- This function will insert a row into public.profiles for every new sign up.
-- For the first user (usually the one setting up the app), it can default to 'owner'.
-- Later accounts created can be adjusted in the database or via an admin screen if needed.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_first_user boolean;
BEGIN
    -- Check if this is the very first profile being created
    SELECT count(*) = 0 INTO is_first_user FROM public.profiles;

    INSERT INTO public.profiles (id, household_role, display_name)
    VALUES (
        new.id,
        CASE WHEN is_first_user THEN 'owner' ELSE 'student' END, -- Default first user to owner, others to student (can be updated to co-owner manually later)
        new.raw_user_meta_data->>'display_name' -- Optional: pull display_name if passed in signup metadata
    );

    RETURN new;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- =========================================================================
-- Phase 1.5 - Curriculum & Standards Setup
-- =========================================================================

-- Create curricula table
CREATE TABLE IF NOT EXISTS curricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    pacing_type TEXT NOT NULL,    -- e.g. 'calendar' or 'mastery'
    delivery_mode TEXT NOT NULL,  -- e.g. 'physical', 'online', 'hybrid'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;

-- Create curriculum_items table
CREATE TABLE IF NOT EXISTS curriculum_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    item_type TEXT NOT NULL,      -- e.g. 'reading', 'video', 'worksheet'
    external_url TEXT,
    estimated_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE curriculum_items ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- RLS Policies - Curricula
-- =========================================================================
CREATE POLICY "Parents have full access to curricula" 
    ON curricula FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view their own curricula" 
    ON curricula FOR SELECT 
    USING (get_user_role() = 'student' AND student_id = get_linked_student_id());

-- =========================================================================
-- RLS Policies - Curriculum Items
-- =========================================================================
CREATE POLICY "Parents have full access to curriculum_items" 
    ON curriculum_items FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view their own curriculum_items" 
    ON curriculum_items FOR SELECT 
    USING (
        get_user_role() = 'student' 
        AND curriculum_id IN (
            SELECT id FROM curricula WHERE student_id = get_linked_student_id()
        )
    );
-- Fix for Phase 1.5 Schema: Curriculum Assignment & Pacing Anchors
-- We need to drop student_id from curricula so it can act as a generic library,
-- and create a join table (student_curricula) that holds the start_date and sequence tracking.

-- 1. Remove student_id from curricula (make it generic)
ALTER TABLE curricula DROP COLUMN student_id;

-- 2. Create student_curricula join table
CREATE TABLE IF NOT EXISTS student_curricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    curriculum_id UUID NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_sequence_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, curriculum_id)
);
ALTER TABLE student_curricula ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for student_curricula
CREATE POLICY "Parents have full access to student_curricula" 
    ON student_curricula FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

CREATE POLICY "Students can view their own curriculum assignments" 
    ON student_curricula FOR SELECT 
    USING (get_user_role() = 'student' AND student_id = get_linked_student_id());

-- 4. Update curricula RLS policies since we dropped student_id
DROP POLICY IF EXISTS "Students can view their own curricula" ON curricula;

-- Allow students to view curricula if they are assigned to it
CREATE POLICY "Students can view their assigned curricula" 
    ON curricula FOR SELECT 
    USING (
        get_user_role() = 'student' AND id IN (
            SELECT curriculum_id FROM student_curricula WHERE student_id = get_linked_student_id()
        )
    );
-- =========================================================================
-- Phase 1.75 - Differentiators (Standards, Unit Studies, Peer Teaching)
-- =========================================================================

-- Create standards table
CREATE TABLE IF NOT EXISTS standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework TEXT NOT NULL, -- e.g. 'Wisconsin DPI' or 'Common Core'
    code TEXT NOT NULL,      -- e.g. 'RL.1.2'
    subject TEXT NOT NULL,   -- e.g. 'Reading'
    grade_level TEXT NOT NULL,
    short_description TEXT NOT NULL, -- Paraphrased to avoid copyright
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;

-- Create curriculum_item_standards
CREATE TABLE IF NOT EXISTS curriculum_item_standards (
    curriculum_item_id UUID NOT NULL REFERENCES curriculum_items(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
    ai_suggested BOOLEAN NOT NULL DEFAULT false,
    confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (curriculum_item_id, standard_id)
);
ALTER TABLE curriculum_item_standards ENABLE ROW LEVEL SECURITY;

-- Create unit_study_templates
CREATE TABLE IF NOT EXISTS unit_study_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic_description TEXT,
    subject TEXT,
    grade_range TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE unit_study_templates ENABLE ROW LEVEL SECURITY;

-- Create unit_studies
CREATE TABLE IF NOT EXISTS unit_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic_description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    template_id UUID REFERENCES unit_study_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE unit_studies ENABLE ROW LEVEL SECURITY;

-- Create unit_study_objectives
CREATE TABLE IF NOT EXISTS unit_study_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_study_id UUID NOT NULL REFERENCES unit_studies(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    objective_description TEXT NOT NULL,
    standard_id UUID REFERENCES standards(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE unit_study_objectives ENABLE ROW LEVEL SECURITY;

-- Note: daily_logs.shared_activity_group_id and daily_logs.unit_study_id 
-- were already created in the Phase 1 MVP schema, so we do not need to add them here!

-- =========================================================================
-- RLS Policies
-- =========================================================================
DROP POLICY IF EXISTS "Parents have full access to standards" ON standards;
CREATE POLICY "Parents have full access to standards" ON standards FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view standards" ON standards;
CREATE POLICY "Students can view standards" ON standards FOR SELECT USING (get_user_role() = 'student');

DROP POLICY IF EXISTS "Parents have full access to curriculum_item_standards" ON curriculum_item_standards;
CREATE POLICY "Parents have full access to curriculum_item_standards" ON curriculum_item_standards FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view curriculum_item_standards" ON curriculum_item_standards;
CREATE POLICY "Students can view curriculum_item_standards" ON curriculum_item_standards FOR SELECT USING (get_user_role() = 'student');

DROP POLICY IF EXISTS "Parents have full access to unit_study_templates" ON unit_study_templates;
CREATE POLICY "Parents have full access to unit_study_templates" ON unit_study_templates FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view unit_study_templates" ON unit_study_templates;
CREATE POLICY "Students can view unit_study_templates" ON unit_study_templates FOR SELECT USING (get_user_role() = 'student');

DROP POLICY IF EXISTS "Parents have full access to unit_studies" ON unit_studies;
CREATE POLICY "Parents have full access to unit_studies" ON unit_studies FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view unit_studies" ON unit_studies;
CREATE POLICY "Students can view unit_studies" ON unit_studies FOR SELECT USING (get_user_role() = 'student');

DROP POLICY IF EXISTS "Parents have full access to unit_study_objectives" ON unit_study_objectives;
CREATE POLICY "Parents have full access to unit_study_objectives" ON unit_study_objectives FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view their own unit_study_objectives" ON unit_study_objectives;
CREATE POLICY "Students can view their own unit_study_objectives" ON unit_study_objectives FOR SELECT USING (get_user_role() = 'student' AND student_id = get_linked_student_id());
-- Add status column to profiles (Phase 1.9)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active'));

-- Update profiles to have 'active' for existing users (assuming existing are active)
UPDATE profiles SET status = 'active';

-- Modify profiles RLS for Phase 1.9 (Owner-only invites)
DROP POLICY IF EXISTS "Parents have full access to profiles" ON profiles;

CREATE POLICY "Owners have full access to profiles" 
    ON profiles FOR ALL 
    USING (get_user_role() = 'owner');

CREATE POLICY "Co-owners can view profiles" 
    ON profiles FOR SELECT 
    USING (get_user_role() = 'co-owner');

CREATE POLICY "Co-owners can update own profile" 
    ON profiles FOR UPDATE 
    USING (id = auth.uid() AND get_user_role() = 'co-owner');


-- Phase 2 Tables

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    location TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents have full access to trips" ON trips;
CREATE POLICY "Parents have full access to trips" ON trips FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view trips" ON trips;
CREATE POLICY "Students can view trips" ON trips FOR SELECT USING (get_user_role() = 'student');

-- Trip Students junction
CREATE TABLE IF NOT EXISTS trip_students (
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (trip_id, student_id)
);
ALTER TABLE trip_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents have full access to trip_students" ON trip_students;
CREATE POLICY "Parents have full access to trip_students" ON trip_students FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view trip_students" ON trip_students;
CREATE POLICY "Students can view trip_students" ON trip_students FOR SELECT USING (get_user_role() = 'student');


-- Media Attachments
CREATE TABLE IF NOT EXISTS media_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    is_portfolio_sample BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure it belongs to at least one thing, or relax if needed
    CONSTRAINT check_attachment_link CHECK (log_id IS NOT NULL OR trip_id IS NOT NULL)
);
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents have full access to media" ON media_attachments;
CREATE POLICY "Parents have full access to media" ON media_attachments FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view media" ON media_attachments;
CREATE POLICY "Students can view media" ON media_attachments FOR SELECT USING (get_user_role() = 'student');
-- Assuming students might need to upload media later, they'd need INSERT policy, but MVP is parents for now or similar to daily logs.
DROP POLICY IF EXISTS "Students can insert media" ON media_attachments;
CREATE POLICY "Students can insert media" ON media_attachments FOR INSERT WITH CHECK (get_user_role() = 'student');


-- Narrations
CREATE TABLE IF NOT EXISTS narrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE,
    audio_url TEXT,
    transcript_text TEXT,
    tagged_skill TEXT,
    tag_confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE narrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents have full access to narrations" ON narrations;
CREATE POLICY "Parents have full access to narrations" ON narrations FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view own narrations" ON narrations;
CREATE POLICY "Students can view own narrations" ON narrations FOR SELECT USING (get_user_role() = 'student' AND student_id = get_linked_student_id());
DROP POLICY IF EXISTS "Students can insert narrations" ON narrations;
CREATE POLICY "Students can insert narrations" ON narrations FOR INSERT WITH CHECK (get_user_role() = 'student' AND student_id = get_linked_student_id());
DROP POLICY IF EXISTS "Students can update own unconfirmed narrations" ON narrations;
CREATE POLICY "Students can update own unconfirmed narrations" ON narrations FOR UPDATE USING (get_user_role() = 'student' AND student_id = get_linked_student_id() AND tag_confirmed = false);


-- Benchmark References
CREATE TABLE IF NOT EXISTS benchmark_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL
);
ALTER TABLE benchmark_references ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read benchmarks" ON benchmark_references;
CREATE POLICY "Anyone can read benchmarks" ON benchmark_references FOR SELECT USING (true);


-- Benchmark Progress
CREATE TABLE IF NOT EXISTS benchmark_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    benchmark_id UUID NOT NULL REFERENCES benchmark_references(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Not Yet', 'Emerging', 'Demonstrated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, benchmark_id)
);
ALTER TABLE benchmark_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents have full access to benchmark_progress" ON benchmark_progress;
CREATE POLICY "Parents have full access to benchmark_progress" ON benchmark_progress FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
DROP POLICY IF EXISTS "Students can view own benchmark_progress" ON benchmark_progress;
CREATE POLICY "Students can view own benchmark_progress" ON benchmark_progress FOR SELECT USING (get_user_role() = 'student' AND student_id = get_linked_student_id());
-- Add google_event_id to curriculum_items if it doesn't exist
ALTER TABLE curriculum_items ADD COLUMN IF NOT EXISTS IF NOT EXISTS google_event_id TEXT;

-- Create google_calendar_connections table
CREATE TABLE IF NOT EXISTS google_calendar_connections (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    google_account_email TEXT NOT NULL,
    target_calendar_id TEXT,
    sync_direction TEXT NOT NULL DEFAULT 'one-way',
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS for google_calendar_connections
-- Only the 'owner' can insert/update/delete the connection. 'co-owner' can view it.
CREATE POLICY "Owners have full access to calendar connections" 
    ON google_calendar_connections FOR ALL 
    USING (get_user_role() = 'owner');

CREATE POLICY "Co-owners can view calendar connections" 
    ON google_calendar_connections FOR SELECT 
    USING (get_user_role() = 'co-owner');

-- Create work_samples table
CREATE TABLE IF NOT EXISTS work_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    ai_feedback TEXT,
    ai_suggested_score TEXT,
    confirmed_score TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_samples ENABLE ROW LEVEL SECURITY;

-- Students can view their own work samples
CREATE POLICY "Students can view their own work samples" 
    ON work_samples FOR SELECT 
    USING (
        get_user_role() = 'student' 
        AND log_id IN (SELECT id FROM daily_logs WHERE student_id = get_linked_student_id())
    );

-- Students can insert work samples as draft, linked to their own logs
CREATE POLICY "Students can create draft work samples" 
    ON work_samples FOR INSERT 
    WITH CHECK (
        get_user_role() = 'student' 
        AND log_id IN (SELECT id FROM daily_logs WHERE student_id = get_linked_student_id())
        AND status = 'draft'
        AND confirmed_score IS NULL
    );

-- Owners/Co-owners have full access
CREATE POLICY "Parents have full access to work samples" 
    ON work_samples FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

-- Add avatar_url to students
ALTER TABLE public.students ADD COLUMN avatar_url TEXT;

-- Create storage bucket for media if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update media" 
ON storage.objects FOR UPDATE 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete media" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND auth.role() = 'authenticated');
-- Phase 4: Transcript System

CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    credit_earned NUMERIC(4,2) NOT NULL,
    grade_mark TEXT NOT NULL,
    confirmed_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

-- Parents have full access
CREATE POLICY "Parents have full access to transcripts" 
    ON transcripts FOR ALL 
    USING (get_user_role() IN ('owner', 'co-owner'));

-- Students can view their own confirmed transcripts
CREATE POLICY "Students can view their own transcripts" 
    ON transcripts FOR SELECT 
    USING (get_user_role() = 'student' AND student_id = get_linked_student_id());
