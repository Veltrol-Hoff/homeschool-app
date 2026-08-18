# Hoffmann Homeschool App: Architecture & Feature Breakdown

This document provides a comprehensive overview of the application's architecture, database schema, current feature set, and roadmap. It is designed to be copy/pasted into other AI models (like Claude or ChatGPT) to give them complete context for feature brainstorming, architectural review, or code generation.

---

## 1. Core Purpose & Philosophy
A highly customized, compliance-driven Homeschool Planner designed specifically around Wisconsin state regulations (875 total hours, 6 required subjects). 

**Design Principles:**
*   **"AI Drafts, Human Confirms"**: AI is used to suggest standards alignment, transcribe narrations, and grade work, but it *never* silently auto-commits to the database. A parent must always click "Confirm".
*   **Compliance Made Invisible**: The app handles the stress of tracking hours and standards in the background. Parents just log what they did, and the app calculates if they are on track.
*   **Premium & Dynamic UI**: The interface uses modern Next.js patterns, TailwindCSS glassmorphism, micro-animations, and a highly visual calendar system rather than feeling like a dry spreadsheet.

---

## 2. Tech Stack
*   **Framework:** Next.js (App Router)
*   **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Auth)
*   **Styling:** TailwindCSS
*   **Hosting:** Vercel

---

## 3. Database Schema Overview
The database uses Supabase PostgreSQL with strict Row Level Security (RLS) policies enforcing role-based access.

### Core Entities
*   `profiles`: Links `auth.users.id` to a `household_role` (`owner`, `co-owner`, `student`). Students can be linked to a `linked_student_id`.
*   `students`: Tracks `name`, `birth_date`, `current_grade_level`, `display_color`, `reward_points`, and UI permissions.
*   `academic_years`: Global definitions of a school year (`name`, `start_date`, `end_date`).
*   `student_academic_years`: A junction table mapping a `student` to an `academic_year` and assigning their specific `grade_level` for that year.
*   `subjects`: Core subjects (e.g., Math, Science). Tracks `is_state_required` (boolean), `color_hex`, and `icon_name`.

### Logging & Planning
*   `daily_logs`: The central ledger for time tracking. 
    *   Fields: `student_id`, `academic_year_id`, `subject_id`, `date`, `duration_minutes`, `log_type` (Planned vs Completed), `shared_activity_group_id` (for multi-student lessons), `pending_parent_approval` (boolean).
*   `curricula`: Course definitions (e.g. "Biology 101"). Tracks `pacing_type` and `subject_id`.
*   `curriculum_items`: Sequential items belonging to a curriculum. Tracks `sequence_order`, `title`, `item_type` (reading, activity), `estimated_minutes`.
*   `student_curricula`: Links a student to an active curriculum.

### Portfolio & Media
*   `trips`: Field trips/vacations tracking `start_date`, `end_date`, `subject_id`, and `hours_credited`. Linked to students via `trip_students`.
*   `living_bio_entries`: A timeline of student Milestones, Interests, and Goals.
*   `media_attachments`: Photos/videos linked to logs, trips, or bio entries. Tracks `is_portfolio_sample` (boolean).
*   `work_samples`: Photos of graded work linked to a daily log, tracking `ai_suggested_score` and `confirmed_score`.

### Standards & Gamification
*   `standards`: State or national learning standards (Code, Grade Level, Description).
*   `curriculum_item_standards`: Junction linking a curriculum item to a standard.
*   `rewards`: Custom gamification goals for students (e.g. "Pizza Party"). Tracks `points_required` and `is_unlocked`.

---

## 4. Current Feature Set (MVP / Phase 1 Complete)

### Account & Role Management
*   **Owners/Co-owners** have full CRUD access.
*   **Students** can log in, view their own dashboard, and check off their daily checklists. 
*   **Security:** Database RLS prevents students from modifying other students' data. When a student checks off a task, it is strictly flagged as `pending_parent_approval = true` at the database level.
*   **Safety Lock:** The system mathematically guarantees that the final "owner" account cannot be deleted.

### Interactive Calendar System
*   Supports Day, Week, and Month views.
*   **Shared Logs:** Parents can schedule a lesson for multiple students simultaneously. They are linked via `shared_activity_group_id`. Checking the box for one student instantly updates the log for all siblings in that group.
*   **Mobile Optimized:** The month calendar condenses text blocks into colored dots on small screens for scannability.

### Automated Curriculum Scheduling
*   Users can create a curriculum, add sequential items, and then click "Schedule".
*   The system takes the student, start date, and selected days of the week (e.g., M/W/F), and automatically skips weekends and global Holidays to map the sequential items onto the calendar as "Planned" daily logs.

### Compliance & Reporting Engine
*   **Wisconsin Rules Engine:** Verifies that the student has logged activity across all 6 state-required subjects.
*   **Hours Tracking:** Aggregates completed `daily_logs` + credited `trips` to calculate progress toward the 875-hour goal.
*   **Pacing Radar:** Visualizes if a student is "On Track" or "Behind" in specific subjects based on the time elapsed in the academic year.
*   **Standards Coverage:** Automatically calculates how many assigned curriculum lessons cover specific state standards.

### End-of-Year Export (PDF Portfolio)
*   A dedicated module that generates a printable, modular PDF.
*   Parents can toggle sections: Hours Summary, 6-Subject Checklist, Standards Coverage, Portfolio Photos, and Transcript.

### Gamification & Living Bio
*   **Living Bio:** A Facebook-style chronological timeline on the student settings page to record Milestones and Interests, attaching media URLs.
*   **Rewards:** A progress bar on the Student Dashboard that fills up toward their next reward goal based on `reward_points`.

---

## 5. Backlog & Immediate Roadmap

**1. Curriculum Bulk Import (CSV)**
*   Need a UI to upload a CSV of curriculum items.
*   Need backend logic to parse and generate these CSVs from raw curriculum schedules (like BookShark grids).

**2. The Review Queue**
*   Because student-checked items are flagged as `pending_parent_approval`, a dedicated "Inbox/Review Queue" screen is needed for the Parent to quickly scroll through student submissions, view attached work samples, and click "Approve" to finalize the hours.

**3. Google Calendar Sync (One-Way)**
*   Implementing OAuth to push "Planned" daily logs and field trips to the parent's Google Calendar.

**4. AI-Assisted Grading & Narration Capture**
*   **Work Samples:** Upload a photo of a math worksheet, AI OCRs it, identifies errors, and drafts a grade.
*   **Narrations:** Use microphone API to record a student narrating a summary of a book, transcribe it via AI, and use LLMs to extract and tag the demonstrated skills (e.g., "Reading Comprehension", "Chronological Sequencing").
