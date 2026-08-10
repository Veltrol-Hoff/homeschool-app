-- Phase 4: Transcript System

CREATE TABLE transcripts (
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
