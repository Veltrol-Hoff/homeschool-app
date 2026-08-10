-- =========================================================================
-- Phase 1.5 - Curriculum & Standards Setup
-- =========================================================================

-- Create curricula table
CREATE TABLE curricula (
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
CREATE TABLE curriculum_items (
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
