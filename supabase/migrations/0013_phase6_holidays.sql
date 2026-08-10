CREATE TABLE IF NOT EXISTS school_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE school_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents have full access to holidays" ON school_holidays FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view holidays" ON school_holidays FOR SELECT USING (get_user_role() = 'student');
