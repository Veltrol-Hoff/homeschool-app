-- Add status column to profiles (Phase 1.9)
ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'active'));

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
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    location TEXT,
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents have full access to trips" ON trips FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view trips" ON trips FOR SELECT USING (get_user_role() = 'student');

-- Trip Students junction
CREATE TABLE trip_students (
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    PRIMARY KEY (trip_id, student_id)
);
ALTER TABLE trip_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents have full access to trip_students" ON trip_students FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view trip_students" ON trip_students FOR SELECT USING (get_user_role() = 'student');


-- Media Attachments
CREATE TABLE media_attachments (
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

CREATE POLICY "Parents have full access to media" ON media_attachments FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view media" ON media_attachments FOR SELECT USING (get_user_role() = 'student');
-- Assuming students might need to upload media later, they'd need INSERT policy, but MVP is parents for now or similar to daily logs.
CREATE POLICY "Students can insert media" ON media_attachments FOR INSERT WITH CHECK (get_user_role() = 'student');


-- Narrations
CREATE TABLE narrations (
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

CREATE POLICY "Parents have full access to narrations" ON narrations FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view own narrations" ON narrations FOR SELECT USING (get_user_role() = 'student' AND student_id = get_linked_student_id());
CREATE POLICY "Students can insert narrations" ON narrations FOR INSERT WITH CHECK (get_user_role() = 'student' AND student_id = get_linked_student_id());
CREATE POLICY "Students can update own unconfirmed narrations" ON narrations FOR UPDATE USING (get_user_role() = 'student' AND student_id = get_linked_student_id() AND tag_confirmed = false);


-- Benchmark References
CREATE TABLE benchmark_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL
);
ALTER TABLE benchmark_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read benchmarks" ON benchmark_references FOR SELECT USING (true);


-- Benchmark Progress
CREATE TABLE benchmark_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    benchmark_id UUID NOT NULL REFERENCES benchmark_references(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Not Yet', 'Emerging', 'Demonstrated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, benchmark_id)
);
ALTER TABLE benchmark_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents have full access to benchmark_progress" ON benchmark_progress FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view own benchmark_progress" ON benchmark_progress FOR SELECT USING (get_user_role() = 'student' AND student_id = get_linked_student_id());
