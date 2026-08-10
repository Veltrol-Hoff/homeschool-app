# Homeschool App — AI Agent Reference (GEMINI.md)

This document is the persistent reference for the AI agent working on the Homeschool Planner & Compliance App. It summarizes the core architecture, phased roadmap, data model, user roles, and critical design principles from the master plan. 

## 1. Tech Stack
- **Frontend/Backend:** Next.js
- **Database/Auth:** Supabase
- **Hosting:** Vercel

## 2. Core Design Principle: "AI Drafts, Human Confirms"
Throughout the application, any AI-assisted feature (e.g., standards tagging, work sample grading, narration skill-tagging) MUST produce a suggestion that requires explicit human confirmation. 
**Crucially:** AI never silently auto-commits or writes final records. It drafts; the parent reviews, edits, and confirms.

## 3. Phased Roadmap

### Phase 1 — MVP (Core Compliance Loop)
- **Screens:** Dashboard, Quick Log, Subjects, Compliance & Reports, Add Student
- **Goal:** Manage students, academic years, logging, and 875-hour goal compliance.

### Phase 1.5 — Curriculum Import + Daily Checklist
- **Screens:** Curriculum & Standards Library, Add Curriculum Items, Today (Checklist)
- **Goal:** Curriculum-agnostic planning (calendar-paced vs. mastery-paced) and a daily checklist.

### Phase 1.75 — Differentiators
- **Screens:** Standards Coverage Checklist, Unit Study Mode, Shared/Multi-Student Log
- **Goal:** Support multi-student logs, unit studies, and AI-suggested standards tagging. Includes a unified "Review Queue" for pending AI suggestions/student logs.

### Phase 2 — Portfolio, Media & Trips
- **Screens:** Media Upload, Trips & Vacations, Narration Capture
- **Goal:** Log trips with photos, star portfolio samples, and record/transcribe narrations (with AI skill-tagging).

### Phase 2.5 — Calendar & Google Calendar Sync
- **Screens:** Calendar (Month/Week/Day), Google Calendar Sync Settings
- **Goal:** One-way sync (App → Google) of planned lessons and field trips.

### Phase 3 — AI-Assisted Grading + Closed-Loop Mastery Pacing
- **Screens:** Work Sample Review
- **Goal:** AI drafts feedback and scores for photographed work (requires confirmation). Adjusts mastery pacing forecasts based on struggle signals.

### Phase 4 — Transcript System
- **Screens:** Transcript (Confirm-based)
- **Goal:** Manually confirmed course/credit/grade finalization, separated from draft/what-if previews.

### Phase 5 — Year-End Portfolio: PDF + Highlight Slideshow
- **Screens:** End-of-Year Export
- **Goal:** Exportable PDF work portfolio with data and photos, plus a browser-based slideshow preview of starred content/narrations.

### Phase 6 — Future / Not Scoped Now
- Two-way Google Calendar sync, full video editing, multi-family features, monetization.

## 4. Complete Data Model

```text
students: id, name, birth_date
academic_years: id, student_id, year_label, grade_level, start_date, end_date
subjects: id, name, is_state_required

daily_logs: id, student_id, academic_year_id, subject_id, date, duration_minutes, log_type, notes, shared_activity_group_id, unit_study_id, trip_id, google_event_id, pending_parent_approval
curricula: id, student_id, subject_id, title, pacing_type, delivery_mode
curriculum_items: id, curriculum_id, sequence_order, title, item_type, external_url, estimated_minutes

standards: id, framework, code, subject, grade_level, short_description
curriculum_item_standards: curriculum_item_id, standard_id, ai_suggested, confirmed
unit_studies: id, title, topic_description, subject_id, template_id
unit_study_templates: id, title, topic_description, subject, grade_range
unit_study_objectives: id, unit_study_id, student_id, objective_description, standard_id

benchmark_references: id, grade_level, subject, description
benchmark_progress: id, grade_level, subject, description

trips: id, title, location, start_date, end_date, description
trip_students: trip_id, student_id
media_attachments: id, log_id, trip_id, file_url, is_portfolio_sample

narrations: id, student_id, log_id, audio_url, transcript_text, tagged_skill, tag_confirmed
work_samples: id, log_id, subject_id, image_url, ai_feedback, ai_suggested_score, confirmed_score, status
transcripts: id, student_id, academic_year_id, subject_id, credit_earned, grade_mark, confirmed_date

google_calendar_connections: id, google_account_email, target_calendar_id, sync_direction, access_token, refresh_token
profiles: id (=auth.users.id), household_role, linked_student_id, display_name
```

## 5. User Management, Roles & Security (RLS)

- **Supabase Auth** is used for login (email/password).
- **Owner (Parent):** Full read/write access to all data and account-level settings.
- **Co-Owner (Parent):** Full read/write access to all data, excluding account-level settings (e.g., Google Calendar reconnect).
- **Student:** Read access to their own compliance progress, curriculum, and narrations. Write access to their own logs/narrations/work samples, but these are forcibly flagged as `pending_parent_approval = true` (enforced via database RLS policy). A parent must confirm them in the Review Queue.
- **Row Level Security (RLS):** All role access and constraints (like forcing `pending_parent_approval` for students, and tying `student_id` to `linked_student_id`) must be strictly enforced at the database level via Supabase RLS policies, ensuring absolute security even if the frontend has bugs.
