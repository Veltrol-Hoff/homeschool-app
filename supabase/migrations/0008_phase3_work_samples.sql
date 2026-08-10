-- Create work_samples table
CREATE TABLE work_samples (
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

