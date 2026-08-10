-- Enable RLS
-- First, create the profiles table which extends auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    household_role TEXT NOT NULL CHECK (household_role IN ('owner', 'co-owner', 'student')),
    linked_student_id UUID, -- Will add FK after students table is created
    display_name TEXT
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Add FK from profiles to students now that students table exists
ALTER TABLE profiles ADD CONSTRAINT fk_linked_student FOREIGN KEY (linked_student_id) REFERENCES students(id) ON DELETE SET NULL;

-- Create academic_years table
CREATE TABLE academic_years (
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
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_state_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Create daily_logs table (includes columns for later phases as nullable, to avoid altering later)
CREATE TABLE daily_logs (
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
