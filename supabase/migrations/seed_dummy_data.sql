-- Dummy Data Seed Script for Phase 1 MVP

-- 1. Insert Students
INSERT INTO public.students (id, name, birth_date)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Milli', '2019-05-01'),
    ('22222222-2222-2222-2222-222222222222', 'Luci', '2021-08-15')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Academic Years
INSERT INTO public.academic_years (id, student_id, year_label, grade_level, start_date, end_date)
VALUES 
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-2027', '1', '2026-09-01', '2027-06-15'),
    ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2026-2027', 'K', '2026-09-01', '2027-06-15')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Subjects
INSERT INTO public.subjects (id, name, is_state_required)
VALUES 
    ('55555555-5555-5555-5555-555555555555', 'Reading', true),
    ('66666666-6666-6666-6666-666666666666', 'Math', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Daily Logs (Dummy hours for progress ring)
-- We insert a massive chunk of minutes for Milli (361 hours = 21660 minutes) and Luci (190 hours = 11400 minutes) to match the mockup
INSERT INTO public.daily_logs (student_id, academic_year_id, subject_id, date, duration_minutes, log_type, notes)
VALUES 
    -- Milli's historical hours
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', '2026-09-10', 21660, 'Planned', 'Historical rollup'),
    
    -- Luci's historical hours
    ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '2026-09-10', 11400, 'Planned', 'Historical rollup'),

    -- Today's items for Milli (2 items)
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 30, 'Planned', 'Reading chapter 3'),
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', CURRENT_DATE, 25, 'Planned', 'Math lesson 12'),

    -- Today's items for Luci (1 item)
    ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', CURRENT_DATE, 20, 'Planned', 'Phonics practice');
