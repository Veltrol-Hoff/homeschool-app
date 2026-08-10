-- Add course_name to curricula and transcripts
ALTER TABLE curricula ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS course_name TEXT;

-- Seed Wisconsin Subjects
INSERT INTO subjects (name, is_state_required)
SELECT * FROM (
    VALUES
        ('Reading', true),
        ('Language Arts', true),
        ('Mathematics', true),
        ('Social Studies', true),
        ('Science', true),
        ('Health', true)
) AS v(name, is_state_required)
WHERE NOT EXISTS (
    SELECT 1 FROM subjects WHERE subjects.name = v.name
);
