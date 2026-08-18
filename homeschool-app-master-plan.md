# Homeschool Planner & Compliance App — Master Plan & Build Guide

**Students:** Milli, Luci &nbsp;|&nbsp; **State:** Wisconsin &nbsp;|&nbsp; **Stack:** Next.js + Supabase + Vercel &nbsp;|&nbsp; **Status:** Reconciled against actual codebase — see Section 7 for verified per-phase status

---

## 1. Overview

This document consolidates every feature, screen, and technical decision into one build-ready reference, reconciled directly against the current codebase (not just intent) as of this revision. Two things changed from earlier drafts: (1) several phases previously marked "done" turned out to be schema-only, corrected below, and (2) the actual build made some genuinely good architectural decisions (global academic years, subject colors/icons, living bio, rewards) that weren't in the original plan — those are now formally adopted here rather than treated as drift.

**Core design principles carried through every phase:**
- **Reverse logging first** — the app never blocks you from logging what actually happened, planned or not.
- **AI drafts, human confirms** — every AI-assisted feature (standards tagging, grading, narration skill-tagging) produces a suggestion you approve, never an automatic final record.
- **Curriculum-agnostic** — nothing in the schema is hardcoded to BookShark or Math-U-See; switching curricula, adding online-delivered courses, or mixing brands per subject all work the same way.
- **Compliance-grade, not compliance-only** — the app documents real childhood (trips, projects, narrations) alongside the legal record, because that's what actually gets used and enjoyed.
- **Single source of truth for hours** *(new, added this revision)* — every path that credits time toward the 875-hour goal must resolve to exactly one `daily_logs` row per student per activity. No feature is allowed to add a second, independent hours total alongside it. This directly fixes the trip double-counting risk identified below.
- **Rewards reflect confirmed work only** *(new, added this revision)* — gamification points may only increment at the moment a parent approves a log in the Review Queue, never at the moment a student submits it. See Section 2, Phase 1.95 for the reasoning.

---

## 2. Feature Roadmap by Phase

### Phase 1 — MVP (core compliance loop) — ✅ Done

**Screens:** Dashboard, Quick Log, Subjects, Compliance & Reports, Add Student

**Dashboard** — student cards, hour progress, today's checklist status:

```
┌─────────────────────────────────────────────────────┐
│ ⚠ PI-1206 filing window open — due Oct 15            │
├───────────────────────────┬───────────────────────────┤
│  Milli · Grade 1           │  Luci · Grade K            │
│  ◔ 41%  361 / 875 hrs      │  ◔ 22%  190 / 875 hrs      │
│  ✓ Today: 2 of 4 done      │  ✓ Today: 1 of 3 done      │
└───────────────────────────┴───────────────────────────┘
```

**Quick Log** — student, subject, duration, log type (Planned/Spontaneous/Field Trip/Peer-Teaching/Completed), notes.

**Compliance & Reports** — per-subject pacing status, 6-subject checklist, PDF export.

**Data:** `students`, `academic_years` (global — see architecture update below), `student_academic_years`, `subjects`, `daily_logs`

**Architecture update — adopted from actual build:** `academic_years` is now a **global** table (name, start_date, end_date) shared across the whole family, rather than one row per student. A `student_academic_years` junction table maps each student to a year and assigns their `grade_level` for that specific year. This is a genuine improvement over the original per-student design — the calendar dates are the same for both kids, only grade level differs — and is now the canonical design going forward.

**Done when:** you can create both students, start an academic year, log activities daily, and see accurate hour totals against the 875-hour goal.

---

### Phase 1.5 — Curriculum Import + Automated Scheduling — ✅ Done (CSV bulk import still pending)

**Screens:** Curriculum & Standards Library, Add Curriculum Items, Today (checklist), Calendar auto-scheduler

**Curriculum & Standards Library:**

```
┌─────────────────────────────────────────────────────┐
│  My curricula          Standards reference            │
├─────────────────────────────────────────────────────┤
│  📖 BookShark Level A                                 │
│     Reading · calendar-paced · 36 wks · 24 items   > │
│  🔢 Math-U-See Alpha                                  │
│     Math · mastery-paced · 30 lessons              > │
├─────────────────────────────────────────────────────┤
│                [+ Add curriculum]                      │
└─────────────────────────────────────────────────────┘
```

**Curriculum-agnostic design:** a curriculum record is just `title + subject + pacing_type`. Switching brands or adding a fully online course is just adding a new curriculum record with `delivery_mode` set appropriately.

**Architecture update — adopted from actual build:** curriculum assignment is now formalized as a `student_curricula` junction table (student ↔ active curriculum), rather than an implicit link — this correctly allows the same curriculum to be reused across students, or different students to run different curricula in the same subject.

**Automated Curriculum Scheduling (built, more advanced than originally scoped):** rather than simple linear weekly pacing, the actual build lets you pick a start date and specific days of the week (e.g. M/W/F), then automatically maps sequential curriculum items onto the calendar as "Planned" daily logs — skipping weekends and globally-defined holidays automatically. This is better than the original plan and is now the canonical scheduling model.

**New — Holidays:** a `holidays` table (name, date, is_recurring) backs the auto-scheduler's holiday-skipping behavior and should also feed the Calendar screen (Phase 2.5) so holidays are visibly marked, not just silently skipped.

**New — Curriculum retire, not delete** *(Feature #4 from the roadmap review)*: add `curricula.status` (`active` / `retired`). When you switch curriculum brands mid-year, the old curriculum is marked `retired`, never deleted — its `curriculum_items` and their links to completed `daily_logs`/`curriculum_item_standards` stay fully intact for your compliance history, while the new curriculum takes over pacing going forward. Build this into the CSV bulk import feature now, since retrofitting it later is more expensive.

**Still pending:** Curriculum Bulk Import via CSV — UI to upload a formatted CSV, backend parsing into `curriculum_items` rows.

**Data:** `curricula` (+ `delivery_mode`, `pacing_type`, `status`), `curriculum_items` (+ `item_type`, `external_url`), `student_curricula`, `holidays`

**Done when:** both curricula are loaded, the day-of-week auto-scheduler correctly skips weekends/holidays, and CSV bulk import successfully creates a full curriculum's items in one action.

---

### Phase 1.75 — Differentiators — ✅ Done (family-subject flag pending)

**Screens:** Standards Coverage Checklist (part of Compliance & Reports), Unit Study Mode, Shared/Multi-Student Log

**Compliance & Standards (expanded):**

```
┌─────────────────────────────────────────────────────┐
│  Milli · 2026–2027                                     │
│  Reading ✓  Math ✓  Health ⚠ behind  Science ✓         │
├─────────────────────────────────────────────────────┤
│  Standards coverage — Reading (WI Standards, Gr. 1)    │
│  ✓ RF.1.3 — decode CVC & multisyllabic words  (3)      │
│  ✓ RL.1.2 — retell stories, identify lesson   (2)      │
│  ○ W.1.1  — write opinion pieces w/ reasons   (0)      │
├─────────────────────────────────────────────────────┤
│              [⬇ Export compliance PDF]                 │
└─────────────────────────────────────────────────────┘
```

**Shared/multi-student log (built, confirmed working):** select both students on one Quick Log or scheduled entry; the app writes one linked record per student via `shared_activity_group_id`. Confirmed behavior: checking the box for one student in the Calendar instantly updates the linked log for siblings in that group too.

**Unit Study Mode:** one topic, differentiated objectives per child. Ships with a starter library plus fully custom option.

**New — Family subject default** *(Feature #3 from the roadmap review, requested now)*: add `subjects.is_family_subject` (boolean). Subjects flagged this way (typically History, Science, Read-Alouds) default the Quick Log / scheduler's student selector to **both** students automatically, instead of requiring a manual multi-select every time — reflecting how experienced multi-age homeschoolers actually teach: topic-based subjects combined, skill-based subjects (Math, phonics) kept separate per child by default.

**Standards tagging (automatic):** unchanged — AI-suggested, human-confirmed, per the core design principle.

**Data:** `standards`, `curriculum_item_standards` (+ `ai_suggested`, `confirmed`), `unit_studies`, `unit_study_templates`, `unit_study_objectives`, `daily_logs.shared_activity_group_id`, `daily_logs.unit_study_id`, `subjects.is_family_subject` *(new)*

**Done when:** standards suggestions appear automatically, the coverage checklist reflects real progress, shared logging is confirmed instant across siblings, and family-subject defaulting is live.

---

### Phase 1.9 — Account & Access Management — ✅ Done

**Screen:** Account Management (Owner-only)

```
┌─────────────────────────────────────────┐
│  Account management                        │
├─────────────────────────────────────────┤
│  👑 you@gmail.com                          │
│     Owner · active                         │
│  ✅ wife@gmail.com                          │
│     Co-owner · active           [Manage]  │
│  💛 milli.student@gmail.com                │
│     Student · linked to Milli               │
│     invite pending              [Resend]  │
├─────────────────────────────────────────┤
│              [+ Invite account]            │
└─────────────────────────────────────────┘
```

Only the Owner can invite accounts or change roles — enforced by RLS, not just hidden UI. Inviting uses Supabase's server-side admin invite API; a matching `profiles` row is created with the chosen `household_role` and, for students, `linked_student_id`.

**Confirmed built (bonus, not originally scoped):** a safety lock mathematically guarantees the final Owner account cannot be deleted — good defensive design, worth keeping documented here since it's not obvious from the schema alone.

**Data:** `profiles.status` (`invited` / `active`)

**Done when:** you can invite your wife as co-owner and, later, student accounts linked to each child, and the Owner-cannot-be-deleted safety lock is verified.

---

### Phase 1.95 — Gamification & Living Bio — ✅ Built (integrity fix pending confirmation)

*(New phase, documenting features the actual build already shipped ahead of this plan — Living Bio and the reward system weren't in the original roadmap but exist in the codebase and are genuinely good additions.)*

**Living Bio:** a chronological timeline on the student's profile recording milestones, interests, and goals, with attached media — a "Facebook-style" personal record distinct from the academic one.

**Rewards:** a `rewards` table (points_required, is_unlocked) tied to a student's `reward_points`, visualized as a progress bar toward a goal on the student dashboard.

**⚠️ Recommended fix, not yet confirmed by you — flagging again since it wasn't in your explicit "yes" list:** research on gamification in learning contexts consistently finds that a heavy emphasis on extrinsic rewards can lead to students gaming the system to reach a reward faster, and can shift focus from the work itself to the reward. Right now, if `reward_points` increment at the moment a student *submits* a log (before parent approval), that creates a direct incentive to over-log or pad entries. **Recommended fix:** `reward_points` should only increment when a parent approves the corresponding log in the Review Queue — never at self-submission. This is cheap to implement (move the increment from the insert trigger to the approval action) and closes a real integrity gap. Confirm you want this before it goes into the next prompt batch.

**Data:** `living_bio_entries` (student_id, entry_type, description, date, media_url), `rewards` (points_required, is_unlocked), `students.reward_points`

**Done when:** Living Bio entries display correctly on the student profile, and reward points only move on parent-approved actions (pending your confirmation above).

---

### Phase 2 — Portfolio, Media & Trips — ✅ Done (double-counting fix required, new features pending)

**Screens:** Media Upload, Trips & Vacations, Narration Capture

**Trips & Vacations:**

```
┌─────────────────────────────────────────────────────┐
│  Trips & vacations                                      │
├─────────────────────────────────────────────────────┤
│  [photo strip]                                          │
│  Yellowstone National Park                               │
│  June 14–19, 2027 · Milli, Luci · 12 photos              │
│  [Science] [Geography]  · Theme: Ecosystems               │
├─────────────────────────────────────────────────────┤
│  State Capitol Tour                                      │
│  March 3, 2027 · Milli, Luci · 4 photos               >  │
├─────────────────────────────────────────────────────┤
│                    [+ Log a trip]                        │
└─────────────────────────────────────────────────────┘
```

**🔴 Critical fix required — trip hours double-counting:** the actual build gives `trips` its own `hours_credited` field, summed alongside `daily_logs` in the compliance total. If a trip *also* has an associated `daily_logs` entry (e.g. from the shared-logging flow), the same hours get counted twice toward your legal 875-hour requirement. **Resolution (per the "single source of truth for hours" principle in Section 1):** logging a trip should auto-create one `daily_logs` row per involved student (split across `trip_subjects`, see below), and `trips.hours_credited` becomes a **read-only, computed** display field — the sum of its linked `daily_logs` rows — never independently editable and never separately added into the compliance total. This must be fixed before you rely on this data for a real filing.

**New — Multi-subject tagging** *(Feature #2 from the roadmap review)*: replace the single `trips.subject_id` with a `trip_subjects` join table, so a single trip (or, more generally, any multi-subject activity) can be tagged to Science *and* Social Studies *and* Health simultaneously — matching how real activities like cooking or a field trip actually work. Decision: logged time **splits** across tagged subjects rather than duplicating in full to each, consistent with the no-double-counting principle.

**New — Trip theme field** *(Feature #6 from the roadmap review)*: a short `trips.theme` text field (e.g. "Ecosystems," "Colonial history"), set when logging the trip. Validated by roadschooling research — experienced roadschooling families deliberately align travel with a topic already being studied rather than treating trips as disconnected from curriculum.

**Media upload, Narration capture, Benchmark parity check:** unchanged from original plan, confirmed built.

**Data:** `trips` (+ `theme`, `hours_credited` now computed), `trip_subjects` *(new, replaces `trips.subject_id`)*, `trip_students`, `media_attachments`, `narrations`, `benchmark_references`, `benchmark_progress`

**Done when:** a trip's hours appear exactly once in the compliance total (verified by a manual audit of a test trip), multiple subjects can be tagged to one trip, and a theme is captured per trip.

---

### Phase 2.5 — Calendar & Google Calendar Sync — 🟡 Partial (Google Cloud setup deferred)

**Screens:** Calendar (Month/Week/Day, confirmed built with mobile dot-condensing), Google Calendar Sync Settings

Calendar views are built and confirmed mobile-optimized (colored dots instead of text blocks on small screens). Holiday markers (from the new `holidays` table in Phase 1.5) should be layered onto this view, not just used silently by the scheduler.

**Google Calendar sync — one-way (app → Google), as decided.** Not yet started — Google Cloud OAuth setup was deferred by you.

**Data:** `google_calendar_connections` (encrypted tokens), `daily_logs.google_event_id`, `curriculum_items.google_event_id`

**Done when:** the Calendar visibly marks holidays, and logging a planned item or trip creates a matching Google Calendar event without duplicating on re-sync.

---

### Phase 3 — AI-Assisted Grading + Closed-Loop Mastery Pacing — 🟡 Partial (upload trigger missing)

**Screens:** Work Sample Review (confirmed built and functional)

**Verified status:** the `work_samples` schema is fully implemented, and the Review UI correctly displays a draft's image, AI feedback, and suggested score, with working edit/confirm actions that update the database. **What's missing:** there is no UI for a student to actually upload a photo of their work, and no backend route that sends that photo to the Anthropic API to generate the initial draft. The "AI Drafts" half of "AI drafts, human confirms" isn't wired up yet — only the "human confirms" half exists.

**Mastery pacing recalibration:** unchanged from original plan — depends on confirmed `work_samples` scores, which in turn depend on the upload trigger being built first.

**Data:** `work_samples` (image_url, ai_feedback, ai_suggested_score, confirmed_score, status) — schema complete; `curricula.pacing_type` driving pacing logic

**Done when:** a student (or parent) can photograph a worksheet, it produces an AI-drafted score/feedback automatically, and it appears in the Review Queue for confirmation.

---

### Phase 4 — Transcript System — ⬜ Not started

**Screens:** Transcript (confirm-based)

Unchanged from original plan — explicit, parent-confirmed entries only; a separate non-final draft/preview view; on-demand (not live) GPA calculation.

**Data:** `transcripts` (student_id, academic_year_id, subject_id, credit_earned, grade_mark, confirmed_date)

**Done when:** a confirmed grade/credit entry is added and reflected correctly, with the draft/preview clearly separated.

---

### Phase 5 — Year-End Portfolio: PDF + Highlight Slideshow — ✅ Fully done

**Verified status:** both halves confirmed working. The `/export` screen's PDF generation is fully functional with modular section toggles. The highlight slideshow is **completely built and functional** — `SlideshowGenerator.tsx` fetches portfolio-flagged media and uses `@ffmpeg/ffmpeg` (WebAssembly) to render and download an `.mp4` directly in the browser. No further work needed on this phase.

**Data:** unchanged from original plan.

---

### Phase 6 — Future / Not Scoped Now

Explicitly deferred: two-way Google Calendar sync, full video editing, multi-family/community features, monetization.

---

### Cross-Cutting Feature — Unified Review Queue — 🟡 Partial (work_samples only)

**Verified status:** a Review Queue screen exists and works correctly for `work_samples` (AI grading confirmation). **It does not yet cover the other three sources** originally scoped: student self-submitted `daily_logs`, AI-suggested `curriculum_item_standards`, or AI-tagged `narrations`. Right now, anything a student self-submits has no visible review path — this is the single highest-priority gap in the whole app, since data is silently accumulating unreviewed.

```
┌───────────────────────────────────────────────┐
│  Review queue          4 items need confirmation │
├───────────────────────────────────────────────┤
│  👤 Luci logged: "Read 2 ch. of Frog and Toad"    │
│     Self-submitted · Reading · 20 min      [Review]│
├───────────────────────────────────────────────┤
│  ✨ Suggested standard for "Reader ch. 4"          │
│     RL.1.2 — retell stories, ID lesson     [Review]│
├───────────────────────────────────────────────┤
│  📷 Work sample graded: Math worksheet             │
│     Milli · AI suggested: Mastered         [Review]│
├───────────────────────────────────────────────┤
│  🎙 Narration skill tag: hamster & cheetah story   │
│     Suggested: Sequencing                  [Review]│
└───────────────────────────────────────────────┘
```

**Immediate priority:** extend the existing Review Queue component to also query `daily_logs.pending_parent_approval`, `curriculum_item_standards.confirmed`, and `narrations.tag_confirmed`, rendering all four types in one inbox rather than only `work_samples`. This is a convenience view over existing fields, not new schema.

**Schema (already exists, confirmed correct):**
- `daily_logs.pending_parent_approval` (boolean, default `false`; forced `true` by RLS policy on student-role inserts)
- `narrations.tag_confirmed` (boolean, default `false` once an AI skill tag is suggested)
- `curriculum_item_standards.confirmed`, `work_samples.status`

---

### Cross-Cutting Feature — Standards Gap Dashboard *(new, Feature #5 from the roadmap review)*

A dedicated screen, not just an inline checklist, showing standards progress *and actively flagging gaps* rather than requiring you to notice them yourself.

```
┌─────────────────────────────────────────────────┐
│  Standards gaps — Milli, Reading, Grade 1           │
├─────────────────────────────────────────────────┤
│  Coverage: 8 of 12 standards touched  ▓▓▓▓▓▓▓░░░  │
├─────────────────────────────────────────────────┤
│  ⚠ W.1.1 — write opinion pieces w/ reasons          │
│     Not covered · year 62% elapsed                  │
│     Suggested: tag to "Reader ch. 5 — opinion       │
│     writing" (unscheduled curriculum item)          │
├─────────────────────────────────────────────────┤
│  ⚠ SL.1.1 — participate in collaborative            │
│     discussions · Not covered · year 62% elapsed    │
└─────────────────────────────────────────────────┘
```

Logic: for any required standard with zero `curriculum_item_standards` links once the academic year is more than halfway elapsed, surface it here with a suggested existing (but not-yet-tagged) curriculum item that could plausibly close the gap — computed by matching the standard's subject/grade against untagged `curriculum_items` in the same subject. This connects data you already compute (Standards Coverage + Pacing Radar) into one proactive view instead of two passive ones.

**Data:** no new tables — a computed view over `standards`, `curriculum_item_standards`, and `curriculum_items`.

**Done when:** the dashboard correctly identifies an uncovered required standard past the halfway point of the year and suggests a real, untagged curriculum item to close it.

---

## 3. Complete Data Model (reconciled with actual build)

```
students                       academic_years (global)      student_academic_years
  id                              id                            student_id → students
  name                            name                          academic_year_id
  birth_date                      start_date / end_date          grade_level
  current_grade_level
  display_color
  reward_points

subjects                       daily_logs                    curricula
  id                              id                             id
  name                            student_id                    subject_id
  is_state_required               academic_year_id               pacing_type (cal/mastery)
  color_hex / icon_name           subject_id                     delivery_mode
  is_family_subject (new)         date                           status (active/retired) (new)
                                    duration_minutes
                                    log_type
                                    notes
                                    shared_activity_group_id
                                    unit_study_id
                                    trip_id
                                    google_event_id
                                    pending_parent_approval

curriculum_items               student_curricula              holidays (new)
  id                              student_id                     id
  curriculum_id                   curriculum_id                  name
  sequence_order                                                 date
  title                                                          is_recurring
  item_type
  external_url
  estimated_minutes

standards                      curriculum_item_standards      unit_studies
  id                              curriculum_item_id             id
  framework                       standard_id                    title / topic_description
  code                            ai_suggested                    subject_id
  subject / grade_level           confirmed                       template_id
  short_description

unit_study_templates           unit_study_objectives          benchmark_references / progress
  id                              id                             id, grade_level, subject,
  title / topic_description       unit_study_id                   description
  subject / grade_range           student_id
                                    objective_description
                                    standard_id

trips                          trip_subjects (new)            trip_students
  id                              trip_id                        trip_id
  title / location                subject_id                     student_id
  start_date / end_date
  description
  theme (new)
  hours_credited (now computed, read-only)

media_attachments               narrations                    work_samples
  id                              id                             id
  log_id / trip_id                student_id / log_id            log_id / subject_id
  file_url                        audio_url / transcript_text    image_url
  is_portfolio_sample             tagged_skill                    ai_feedback
                                    tag_confirmed                  ai_suggested_score
                                                                    confirmed_score
                                                                    status

transcripts                    living_bio_entries (new)        rewards (new)
  id                              id                              id
  student_id / academic_year_id   student_id                      points_required
  subject_id                      entry_type                      is_unlocked
  credit_earned                   description
  grade_mark                      date
  confirmed_date                  media_url

google_calendar_connections    profiles (see Section 4)
  id                              id (= auth.users.id)
  google_account_email            household_role (owner/co-owner/student)
  target_calendar_id              status (invited/active)
  sync_direction                  linked_student_id (nullable)
  access_token (encrypted)        display_name
  refresh_token (encrypted)
```

---

## 4. User Management, Roles & Security

### Roles

| Role | Who | Access |
|---|---|---|
| **Owner** | You | Full read/write on all students, all data, settings, billing/domain config. Protected by a safety lock — cannot be deleted while it's the last remaining Owner. |
| **Co-owner** | Your wife | Full read/write on all students and data, minus account-level settings |
| **Student** | Milli/Luci, later | Read access to their own compliance progress, curriculum, and narrations; write access to their own logs/narrations/work samples, always flagged `pending_parent_approval` until confirmed |

### Implementation

- Supabase Auth (email/password), `profiles` table extending `auth.users` with `household_role` and `linked_student_id`.
- **Row Level Security (RLS)** enforces all of this at the database level. Confirmed correct: `pending_parent_approval` is forced `true` by the policy on student-role inserts, not by client code.
- **Reward integrity rule (new):** RLS/application logic should ensure `students.reward_points` only increments as a side effect of a parent's approval action in the Review Queue — never on the student's own insert. See Phase 1.95.

### Data security in the cloud

- Encryption in transit (Vercel TLS) and at rest (Supabase default).
- Secrets only in environment variables, never in code.
- Backups: Supabase's free tier has limited retention — worth upgrading to Pro for point-in-time recovery once this holds a full year of real records.
- No third-party data sharing beyond Supabase, the Anthropic API (for AI features), and Google (calendar event data only, once Phase 2.5 sync is built).

---

## 5. Hosting on Your GoDaddy Domain

You're keeping GoDaddy as registrar and pointing DNS at Vercel, which hosts the app.

1. In Vercel, add your domain (a subdomain like `planner.yourdomain.com` is recommended, to avoid touching your root domain's other DNS records).
2. Vercel gives you a CNAME target (subdomain) or A record IP (root domain).
3. In GoDaddy → My Products → DNS, add that record.
4. Wait for DNS propagation.
5. Vercel automatically issues a free SSL certificate once verified.

No ongoing cost beyond your existing GoDaddy domain fee.

---

## 6. Technical Implementation Reference

Accounts, environment variables, and initial setup steps are unchanged from earlier planning — GitHub, Supabase, Vercel, Anthropic API, Google Cloud (for Phase 2.5), and your GoDaddy domain. Refer to your project's own setup notes for exact account details already configured; this section is intentionally not repeated here now that the build is underway, to avoid this document drifting out of sync with what's actually configured.

---

## 7. Build Order Checklist (reconciled with verified codebase state)

- [x] Phase 1 — MVP
- [x] Phase 1.5 — Curriculum + Automated Scheduling *(CSV bulk import still pending)*
- [x] Phase 1.75 — Differentiators *(family-subject flag pending)*
- [x] Phase 1.9 — Account & Access Management
- [x] Phase 1.95 — Gamification & Living Bio *(reward-on-approval-only fix pending your confirmation)*
- [x] Phase 2 — Portfolio, Media & Trips *(🔴 double-counting fix required; multi-subject tagging + trip theme pending)*
- [ ] Phase 2.5 — Calendar + Google Calendar one-way sync *(Calendar UI done; Google Cloud OAuth setup deferred)*
- [ ] Phase 3 — AI-Assisted Grading *(🟡 schema + Review UI done; AI upload trigger missing)*
- [ ] Phase 4 — Transcript System
- [x] Phase 5 — Year-End Portfolio *(fully verified: PDF + slideshow both working)*
- [ ] Review Queue — expand beyond work_samples to all 4 pending-review sources
- [ ] Standards Gap Dashboard *(new)*
- [ ] GoDaddy domain connected
- [ ] Wife's co-owner account added
- [ ] Student accounts added

**Immediate priority order, recommended:** (1) Review Queue expansion — unblocks all pending student data, (2) Trip hours double-counting fix — protects the legal record, (3) Phase 3 AI upload trigger — completes an already-half-built feature, (4) new features 2/3/4/5/6 from the roadmap review, (5) Phase 2.5 Google Calendar, (6) Phase 4 Transcripts.
