-- Fix for Phase 1.5 Schema: Curriculum Assignment & Pacing Anchors
-- We need to drop student_id from curricula so it can act as a generic library,
-- and create a join table (student_curricula) that holds the start_date and sequence tracking.

-- 1. Remove student_id from curricula (make it generic)
ALTER TABLE curricula DROP COLUMN student_id;

-- 2. Create student_curricula join table
CREATE TABLE student_curricula (
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
