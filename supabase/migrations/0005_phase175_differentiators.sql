-- =========================================================================
-- Phase 1.75 - Differentiators (Standards, Unit Studies, Peer Teaching)
-- =========================================================================

-- Create standards table
CREATE TABLE standards (
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
CREATE TABLE curriculum_item_standards (
    curriculum_item_id UUID NOT NULL REFERENCES curriculum_items(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
    ai_suggested BOOLEAN NOT NULL DEFAULT false,
    confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (curriculum_item_id, standard_id)
);
ALTER TABLE curriculum_item_standards ENABLE ROW LEVEL SECURITY;

-- Create unit_study_templates
CREATE TABLE unit_study_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic_description TEXT,
    subject TEXT,
    grade_range TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE unit_study_templates ENABLE ROW LEVEL SECURITY;

-- Create unit_studies
CREATE TABLE unit_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic_description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    template_id UUID REFERENCES unit_study_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE unit_studies ENABLE ROW LEVEL SECURITY;

-- Create unit_study_objectives
CREATE TABLE unit_study_objectives (
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
CREATE POLICY "Parents have full access to standards" ON standards FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view standards" ON standards FOR SELECT USING (get_user_role() = 'student');

CREATE POLICY "Parents have full access to curriculum_item_standards" ON curriculum_item_standards FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view curriculum_item_standards" ON curriculum_item_standards FOR SELECT USING (get_user_role() = 'student');

CREATE POLICY "Parents have full access to unit_study_templates" ON unit_study_templates FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view unit_study_templates" ON unit_study_templates FOR SELECT USING (get_user_role() = 'student');

CREATE POLICY "Parents have full access to unit_studies" ON unit_studies FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view unit_studies" ON unit_studies FOR SELECT USING (get_user_role() = 'student');

CREATE POLICY "Parents have full access to unit_study_objectives" ON unit_study_objectives FOR ALL USING (get_user_role() IN ('owner', 'co-owner'));
CREATE POLICY "Students can view their own unit_study_objectives" ON unit_study_objectives FOR SELECT USING (get_user_role() = 'student' AND student_id = get_linked_student_id());
