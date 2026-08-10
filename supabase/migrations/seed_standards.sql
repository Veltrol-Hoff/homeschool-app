-- Seed script for Standards
-- Simulated output of the PDF parsing pipeline for Wisconsin / Common Core Standards
-- Includes Grade K and Grade 1 Reading/Math, fully paraphrased to avoid copyright issues.

INSERT INTO public.standards (id, framework, code, subject, grade_level, short_description, source_url)
VALUES 
    -- Grade 1 Reading (Milli)
    ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'Wisconsin DPI / Common Core', 'RF.1.3', 'Reading', '1', 'Decode basic CVC and common multisyllabic words using phonics rules.', 'https://dpi.wi.gov/standards'),
    ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Wisconsin DPI / Common Core', 'RL.1.2', 'Reading', '1', 'Retell key details of a story and identify its central message or lesson.', 'https://dpi.wi.gov/standards'),
    ('cccccccc-1111-1111-1111-cccccccccccc', 'Wisconsin DPI / Common Core', 'W.1.1', 'Language Arts', '1', 'Write opinion pieces introducing a topic, stating an opinion, and supplying a reason.', 'https://dpi.wi.gov/standards'),
    
    -- Grade 1 Math (Milli)
    ('dddddddd-1111-1111-1111-dddddddddddd', 'Wisconsin DPI / Common Core', '1.OA.A.1', 'Math', '1', 'Solve addition and subtraction word problems within 20.', 'https://dpi.wi.gov/standards'),
    ('eeeeeeee-1111-1111-1111-eeeeeeeeeeee', 'Wisconsin DPI / Common Core', '1.NBT.B.2', 'Math', '1', 'Understand that two-digit numbers represent tens and ones.', 'https://dpi.wi.gov/standards'),
    
    -- Grade K Reading (Luci)
    ('ffffffff-0000-0000-0000-ffffffffffff', 'Wisconsin DPI / Common Core', 'RF.K.1', 'Reading', 'K', 'Understand basic print features, like reading left to right and top to bottom.', 'https://dpi.wi.gov/standards'),
    ('11111111-0000-0000-0000-111111111111', 'Wisconsin DPI / Common Core', 'RL.K.3', 'Reading', 'K', 'Identify characters, settings, and major events in a story with prompting.', 'https://dpi.wi.gov/standards'),
    
    -- Grade K Math (Luci)
    ('22222222-0000-0000-0000-222222222222', 'Wisconsin DPI / Common Core', 'K.CC.A.1', 'Math', 'K', 'Count to 100 by ones and tens.', 'https://dpi.wi.gov/standards'),
    ('33333333-0000-0000-0000-333333333333', 'Wisconsin DPI / Common Core', 'K.OA.A.1', 'Math', 'K', 'Represent addition and subtraction with objects, fingers, or drawings.', 'https://dpi.wi.gov/standards')
ON CONFLICT (id) DO NOTHING;

-- Seed a Unit Study Template while we're here
INSERT INTO public.unit_study_templates (id, title, topic_description, subject, grade_range)
VALUES 
    ('44444444-4444-4444-4444-444444444444', 'Seasons & Weather', 'Exploring the 4 seasons, weather patterns, and how animals adapt.', 'Science', 'K-2'),
    ('55555555-5555-5555-5555-555555555555', 'Community Helpers', 'Learning about local jobs, economy, and community roles.', 'Social Studies', 'K-2')
ON CONFLICT (id) DO NOTHING;
