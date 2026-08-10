# Homeschool Planner & Compliance App — Master Plan & Build Guide

**Students:** Milli, Luci &nbsp;|&nbsp; **State:** Wisconsin &nbsp;|&nbsp; **Stack:** Next.js + Supabase + Vercel &nbsp;|&nbsp; **Status:** Build in progress (Phases 1-3, 5 heavily implemented)

---

## 1. Overview

This document consolidates every feature, screen, and technical decision from planning into one build-ready reference. It's organized by phase, so you (or Claude Code) can build in order without re-deriving decisions already made. Each phase lists its screens (with a simple wireframe), the data it needs, and what "done" looks like.

**Core design principles carried through every phase:**
- **Reverse logging first** — the app never blocks you from logging what actually happened, planned or not.
- **AI drafts, human confirms** — every AI-assisted feature (standards tagging, grading, narration skill-tagging) produces a suggestion you approve, never an automatic final record.
- **Curriculum-agnostic** — nothing in the schema is hardcoded to BookShark or Math-U-See; switching curricula, adding online-delivered courses, or mixing brands per subject all work the same way.
- **Compliance-grade, not compliance-only** — the app documents real childhood (trips, projects, narrations) alongside the legal record, because that's what actually gets used and enjoyed.

---

## 2. Feature Roadmap by Phase

### Phase 1 — MVP (core compliance loop)

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

**Quick Log** — student, subject, duration, log type (Planned/Spontaneous/Field Trip/Peer-Teaching), notes.

**Compliance & Reports** — per-subject pacing status, 6-subject checklist, PDF export.

**Data:** `students`, `academic_years`, `subjects`, `daily_logs`

**Done when:** you can create both students, start an academic year, log activities daily, and see accurate hour totals against the 875-hour goal.

---

### Phase 1.5 — Curriculum Import + Daily Checklist

**Screens:** Curriculum & Standards Library, Add Curriculum Items, Today (checklist)

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

**Curriculum-agnostic design (important for future changes):** a curriculum record is just `title + subject + pacing_type` — nothing brand-specific. Switching from BookShark to a different reading program next year, or adding a fully online course (e.g. a subscription video curriculum), is just adding a new curriculum record with `delivery_mode` set appropriately. Old curricula and their historical logs stay intact — you're not migrating data, just adding new entries going forward.

**Today (checklist):**

```
┌─────────────────────────────────────────┐
│  Milli · Tuesday                          │
├─────────────────────────────────────────┤
│  ☑ BookShark Lvl A — Reader ch. 3   30m  │
│  ☑ Math-U-See Alpha — Lesson 12     25m  │
│  ☐ History read-aloud — ch. 4       20m  │
│  ☐ Handwriting practice             15m  │
├─────────────────────────────────────────┤
│           [+ Log something else]          │
└─────────────────────────────────────────┘
```

**Data:** `curricula` (+ `delivery_mode`, `pacing_type`), `curriculum_items` (+ `item_type`, `external_url`)

**Done when:** both curricula are loaded, pacing works for both calendar-paced (BookShark) and mastery-paced (Math-U-See) styles, and Today auto-populates from them.

---

### Phase 1.75 — Differentiators

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

**Shared/multi-student log:** select both students on one Quick Log entry (e.g. a field trip); the app writes one linked record per student, each mapped to their own grade level, tied together with a `shared_activity_group_id`.

**Unit Study Mode:** one topic, differentiated objectives per child — solves the "teaching two grade levels at once" problem. Ships with a starter library (seasons, life cycles, simple machines, geography) plus fully custom option.

**Standards tagging (automatic):** when a curriculum item is added, its description is sent to the Claude API along with the relevant standards for that subject/grade; a suggested standard code comes back pre-filled, editable before it's confirmed — never silently auto-committed.

**Seeding the `standards` table:** source data comes from the official Common Core and Wisconsin DPI standards PDFs (already on hand). Extract **codes, subject, grade level, and a short paraphrased description per standard** — not the full verbatim standard text — and link each entry back to the official source for anyone who wants the complete language. This keeps the app compliant with the standards' copyright/public-license terms while still giving the app everything it functionally needs.

**Data:** `standards`, `curriculum_item_standards` (+ `ai_suggested`, `confirmed`), `unit_studies`, `unit_study_templates`, `unit_study_objectives`, `daily_logs.shared_activity_group_id`, `daily_logs.unit_study_id`

**Done when:** standards suggestions appear automatically on new curriculum items, the coverage checklist reflects real progress, and one shared-trip log correctly splits into two student records.

---

### Phase 2 — Portfolio, Media & Trips

**Screens:** Media Upload, Trips & Vacations, Narration Capture

**Trips & Vacations:**

```
┌─────────────────────────────────────────────────────┐
│  Trips & vacations                                      │
├─────────────────────────────────────────────────────┤
│  [photo strip]                                          │
│  Yellowstone National Park                               │
│  June 14–19, 2027 · Milli, Luci · 12 photos              │
│  [Science] [Geography]                                   │
├─────────────────────────────────────────────────────┤
│  State Capitol Tour                                      │
│  March 3, 2027 · Milli, Luci · 4 photos               >  │
├─────────────────────────────────────────────────────┤
│                    [+ Log a trip]                        │
└─────────────────────────────────────────────────────┘
```

**Media upload** attaches to a log entry, unit study, or trip; any photo can be starred as a portfolio sample (Beginning/Middle/End of year).

**Narration capture (refined):** record button lives on reading-log entries; after Claude API transcription, one optional follow-up tags which comprehension skill the narration demonstrates (retelling, sequencing, etc.), linking it to the standards/benchmark vocabulary already in the system.

**Benchmark parity check:** optional, informal comparison against paraphrased public grade-level benchmarks — explicitly framed as a comfort-check, not a compliance requirement.

**Data:** `trips`, `trip_students`, `media_attachments` (+ `trip_id`, `is_portfolio_sample`), `narrations`, `benchmark_references`, `benchmark_progress`

**Done when:** you can log a multi-day trip with photos, star portfolio samples, and record/transcribe a narration end to end.

---

### Phase 2.5 — Calendar & Google Calendar Sync

**Screens:** Calendar (Month/Week/Day), Google Calendar Sync Settings

**Calendar (month view):**

```
┌───────────────────────────────────────────────┐
│ [Month][Week][Day]         ‹  March 2027  ›     │
├───┬───┬───┬───┬───┬───┬───┬                     │
│ S │ M │ T │ W │ T │ F │ S │                     │
├───┼───┼───┼───┼───┼───┼───┤                     │
│   │   │ 1 │ 2 │ 3 │ 4 │ 5 │                     │
│   │   │   │•R │•M │🚌 │   │  • = lesson tag     │
│   │   │   │   │•M │zoo│   │  🚌 = field trip     │
└───┴───┴───┴───┴───┴───┴───┘                     │
📅 Synced with Google Calendar · last synced 2m ago │
└───────────────────────────────────────────────┘
```

**Google Calendar sync — one-way (app → Google), as decided.** The app pushes planned lessons, field trips, and the PI-1206 deadline to a chosen Google calendar (e.g. your existing family calendar), so they're visible from any normal calendar app without opening this one. Requires a one-time Google Cloud project + OAuth setup (detailed in the Build Guide, Section 6).

**Data:** `google_calendar_connections` (encrypted tokens), `daily_logs.google_event_id`, `curriculum_items.google_event_id`

**Done when:** logging a planned item or trip in the app creates a matching event on your Google family calendar within a minute or two, without duplicates on re-sync.

---

### Phase 3 — AI-Assisted Grading + Closed-Loop Mastery Pacing

**Screens:** Work Sample Review

- Photograph completed work → upload → Claude API drafts feedback + a suggested score/mastery note → you review, edit, and confirm before it's saved to the record.
- For Math-U-See specifically: repeated signs of struggle on a lesson (from grading signals or logged time) adjust that subject's *mastery-paced* pacing forecast — separate logic from BookShark's *calendar-paced* forecast, so the Phase 1.75 pacing radar doesn't falsely flag "behind" when a child is legitimately still working through a concept.

**Data:** `work_samples` (image_url, ai_feedback, ai_suggested_score, confirmed_score, status), `curricula.pacing_type` driving separate pacing logic

**Done when:** a photographed worksheet produces a reviewable AI draft, and confirming it updates the student's record — never automatically.

---

### Phase 4 — Transcript System

**Screens:** Transcript (confirm-based)

- You explicitly add a course/credit/grade when it's finalized — nothing writes automatically from daily logs.
- A separate, clearly-labeled "draft preview" view can show a what-if projection from current data, but it never touches the real transcript table until you confirm.

**Data:** `transcripts` (student_id, academic_year_id, subject_id, credit_earned, grade_mark, confirmed_date)

**Done when:** you can add a confirmed grade/credit and see it reflected in a clean transcript view, with the draft/preview clearly separated from confirmed entries.

---

### Phase 5 — Year-End Portfolio: PDF + Highlight Slideshow

**Screens:** End-of-Year Export

```
┌─────────────────────────────────────────┐
│  End-of-year report — Milli, 2026–2027    │
├─────────────────────────────────────────┤
│  ☑ Hours summary                          │
│  ☑ 6-subject checklist                    │
│  ☑ Standards coverage                     │
│  ☑ Curriculum completion                  │
│  ☐ Confirmed grades / transcript          │
│  ☑ Portfolio photos                       │
├─────────────────────────────────────────┤
│            [⬇ Generate PDF]               │
├─────────────────────────────────────────┤
│  🎬 Highlight slideshow  [beta]           │
│  Starred photos + narration clips,        │
│  played in sequence with crossfades.      │
│              [Preview slideshow]           │
└─────────────────────────────────────────┘
```

**PDF work portfolio:** consolidated, includes embedded starred photos alongside the compliance data — the actual artifact you'd hand over or archive.

**Highlight slideshow (realistic scope):** starred photos + narration audio, sequenced with simple crossfades, built with a browser-based tool (e.g. ffmpeg.wasm) rather than a full video editor. This is intentionally scoped down from "video resume" to something buildable — true multi-clip cinematic editing is a Phase 6/future idea, not part of this build.

**Done when:** a one-click PDF includes real photos and data, and a slideshow preview plays starred content in sequence.

---

### Phase 6 — Future / Not Scoped Now

Explicitly deferred, revisit later if desired: two-way Google Calendar sync, full video editing, multi-family/community features, monetization.

---

### Cross-Cutting Feature — Unified Review Queue

Four different features across the roadmap produce something that needs a parent's confirmation before it becomes part of the official record: student self-submitted logs, AI-suggested standard codes, AI-drafted work sample grading, and AI-tagged narration skills. Rather than reviewing each on its own separate screen, one **Review Queue** screen aggregates all pending items across all four sources into a single inbox — tap into any item to approve, edit, or reject it.

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

This is a convenience view, not a new source of truth — it queries the existing `pending`/`unconfirmed` status fields already present on `daily_logs`, `curriculum_item_standards`, `work_samples`, and `narrations` (see schema note below). Build this once real review-worthy data exists — practically speaking, it's worth adding as soon as Phase 1.75 (AI standards suggestions) and student accounts both exist, so it doesn't need its own dedicated phase.

**Schema clarification (fields referenced above, now made explicit):**
- `daily_logs.pending_parent_approval` (boolean, default `false`; forced `true` by RLS policy on student-role inserts)
- `narrations.tag_confirmed` (boolean, default `false` once an AI skill tag is suggested)
- (`curriculum_item_standards.confirmed` and `work_samples.status` already covered these for their respective tables)

## 3. Complete Data Model

```
students                    academic_years              subjects
  id                          id                           id
  name                        student_id → students        name
  birth_date                  year_label                   is_state_required
                               grade_level
                               start_date / end_date

daily_logs                  curricula                    curriculum_items
  id                           id                           id
  student_id                   student_id                   curriculum_id
  academic_year_id             subject_id                   sequence_order
  subject_id                   title                         title
  date                         pacing_type (cal/mastery)     item_type (reading/video/
  duration_minutes             delivery_mode (physical/       online_module/worksheet)
  log_type                      online/hybrid)                external_url
  notes                                                       estimated_minutes
  shared_activity_group_id
  unit_study_id
  trip_id
  google_event_id

standards                   curriculum_item_standards    unit_studies
  id                           curriculum_item_id           id
  framework                    standard_id                  title
  code                         ai_suggested                  topic_description
  subject / grade_level        confirmed                     subject_id
  short_description                                          template_id

unit_study_templates        unit_study_objectives        benchmark_references / progress
  id                           id                            id, grade_level, subject,
  title / topic_description    unit_study_id                 description
  subject / grade_range        student_id
                                objective_description
                                standard_id

trips                       trip_students                 media_attachments
  id                           trip_id                       id
  title / location             student_id                    log_id / trip_id
  start_date / end_date                                      file_url
  description                                                is_portfolio_sample

narrations                  work_samples                  transcripts
  id                           id                            id
  student_id / log_id          log_id / subject_id           student_id / academic_year_id
  audio_url / transcript_text  image_url                     subject_id
  tagged_skill                 ai_feedback                    credit_earned
                                ai_suggested_score             grade_mark
                                confirmed_score                confirmed_date

google_calendar_connections   profiles (user management — see Section 4)
  id                            id (= auth.users.id)
  google_account_email          household_role (owner/co-owner/student)
  status (invited/active)       
  target_calendar_id            linked_student_id (nullable)
  sync_direction                display_name
  access_token (encrypted)
  refresh_token (encrypted)
```

---

## 4. User Management, Roles & Security

### Roles

| Role | Who | Access |
|---|---|---|
| **Owner** | You | Full read/write on all students, all data, settings, billing/domain config |
| **Co-owner** | Your wife | Full read/write on all students and data, same as Owner minus account-level settings (e.g. Google Calendar reconnection, deployment config) |
| **Student** | Milli/Luci, later | Read access to their own compliance progress, curriculum, and narrations; write access to their own logs/narrations/work samples, but flagged `pending_parent_approval` until a parent confirms — mirrors the "AI drafts, human confirms" pattern already used elsewhere, so a kid's self-report never silently becomes the official record |

### Implementation

- Supabase Auth handles login (email/password is sufficient — no need for social login).
- A `profiles` table extends `auth.users` with `household_role` and (for student accounts) `linked_student_id`.
- **Row Level Security (RLS)** policies enforce all of this at the database level, not just in the app UI — meaning even a bug in the frontend code can't leak another family's data or let a student-role account silently edit official records. Example policy logic:
  - Owner/Co-owner: full access to all rows.
  - Student: `SELECT` only where `student_id = profiles.linked_student_id`; `INSERT` allowed on `daily_logs`/`narrations` with `pending_parent_approval = true` forced by the policy, not the client.
- Student accounts are created later (Phase-agnostic — add whenever you're ready, no schema changes needed since `profiles.linked_student_id` already supports it).

### Data security in the cloud

- **Encryption in transit:** every request over HTTPS, enforced automatically by Vercel's TLS.
- **Encryption at rest:** Supabase encrypts stored data by default.
- **Secrets:** Supabase URL/key and Google OAuth credentials live only in environment variables (local `.env.local`, never committed to git; Vercel's dashboard for production) — never in code.
- **Backups:** Supabase's free tier has limited backup retention. Given this holds your kids' legal education records, it's worth considering Supabase's Pro tier (paid) once the app is live, specifically for point-in-time recovery — cheap insurance against accidental deletion. Not required to start, worth revisiting after Phase 1.
- **No third-party data sharing:** nothing in this design sends student data anywhere except Supabase (your database) and, per-feature, the Anthropic API (for AI grading/standards suggestions/transcription) and Google (only for calendar event titles/times you choose to sync — not full student records).

---

## 5. Hosting on Your GoDaddy Domain

You don't need to move your domain off GoDaddy — you're keeping GoDaddy as the registrar and just pointing DNS at Vercel, which hosts the actual app.

1. In Vercel, add your domain (or a subdomain like `planner.yourdomain.com` — recommended, since a subdomain avoids touching your root domain's existing DNS records like email).
2. Vercel gives you either a CNAME target (for a subdomain) or an A record IP (for a root domain).
3. Log into **GoDaddy → My Products → DNS** for your domain.
4. Add the record Vercel gave you (CNAME pointing to Vercel, or an A record with Vercel's IP). GoDaddy's DNS editor is straightforward — you're just adding one new row.
5. Wait for DNS propagation (usually minutes, occasionally up to a few hours).
6. Vercel automatically issues a free SSL certificate once it verifies the domain — your app is then reachable at `https://planner.yourdomain.com` with a proper padlock, not a scary browser warning.

No ongoing cost beyond what you already pay GoDaddy for the domain itself — Vercel's free tier covers hosting at this scale.

---

## 6. Technical Implementation Start Guide

### Step 0 — Create every account, in order

This section is written to be handed directly to an execution agent (Gemini Code, Claude Code, or done manually) — each step is concrete enough to follow without needing to come back here for clarification.

**0.1 — GitHub**
1. Go to github.com → Sign up. Use an email you check regularly.
2. Enable two-factor authentication (Settings → Password and authentication) — worth doing given this repo will eventually connect to your database and API keys.
3. Create a new **private** repository for the project (e.g. `homeschool-planner`). Private, not public — this is a family app, not an open-source project.
4. Install git locally if not already present (git-scm.com), then set your identity once:
   ```
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```

**0.2 — Node.js**
1. Download the current LTS version from nodejs.org and install it.
2. Verify: `node -v` and `npm -v` in a terminal — both should print version numbers.

**0.3 — Supabase**
1. Go to supabase.com → Sign up (signing up with your GitHub account is fine and simplifies things).
2. Create a new project: give it a name, generate a strong database password, and **save that password in a password manager immediately** — it's shown only once.
3. Choose a region geographically close to Wisconsin (e.g. a US East or Central region) for speed.
4. Once provisioned, go to Settings → API and copy the **Project URL** and **anon public key** — you'll need both shortly. There's also a **service_role key** on this page: this one is far more powerful (it bypasses Row Level Security) and must never be exposed in frontend code — only used server-side, if at all.
5. Go to Authentication → Providers and confirm Email is enabled for sign-up/sign-in.
6. Go to Storage → create a new bucket (e.g. `media`) for future photo/video uploads.

**0.4 — Vercel**
1. Go to vercel.com → Sign up using your GitHub account (this makes importing the repo later a one-click step).
2. Nothing else to configure yet — there's no project to import until code exists.

**0.5 — Anthropic API (powers AI grading, standards suggestions, and narration transcription)**
1. Go to console.anthropic.com → Sign up. Note: this is separate from a claude.ai subscription — it's pay-as-you-go API billing.
2. Add a payment method and set a low monthly spend alert/limit to start (Settings → Billing) — usage at your scale (a personal app for 2 kids) will be inexpensive, but a spend cap is good practice regardless.
3. Create an API key (Settings → API Keys) and save it in your password manager immediately — it's shown only once.

**0.6 — Google Cloud (for Calendar sync — needed by Phase 2.5, fine to set up now or defer)**
1. Go to console.cloud.google.com → create a new project.
2. In the API library, search for and enable the **Google Calendar API**.
3. Go to APIs & Services → OAuth consent screen. Choose "External," fill in basic app info, and add your own Google account as a test user (this keeps it in testing mode, which is fine for personal use and avoids Google's app-review process).
4. Go to Credentials → Create Credentials → OAuth client ID → Web application. Add an authorized redirect URI matching your future app's callback route (you'll finalize this once the app's URL is known — a placeholder like `http://localhost:3000/api/auth/callback/google` works for local development).
5. Save the Client ID and Client Secret in your password manager.

**0.7 — Domain (new domain via GoDaddy, per your decision)**
1. Purchase the new domain through GoDaddy as planned.
2. Don't configure DNS yet — that happens in Section 5, once the app is actually deployed to Vercel and ready to connect.

**0.8 — Credential checklist**
Before writing any code, you should have all of these saved in a password manager:
- Supabase Project URL
- Supabase anon public key
- Supabase service_role key (server-side only, use sparingly)
- Supabase database password
- Anthropic API key
- Google OAuth Client ID + Client Secret
- GitHub repo URL

These become environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) in Step 2 below — never committed to git, entered locally in `.env.local` and separately in Vercel's dashboard for production.

**0.9 — Coding agent context file**
Whichever agent executes this (Gemini Code, Claude Code, or another), create a context file at the project root — `GEMINI.md` for Gemini Code, `CLAUDE.md` for Claude Code — containing: this document's Section 2 (phase list), Section 3 (data model), Section 4 (roles/RLS), and the standards-copyright note above. The agent should treat this master plan as the source of truth throughout the build, not just at the start.

### Step 1 — Supabase setup
1. Create a Supabase project.
2. Run the full SQL schema (Section 3) via Supabase's SQL editor, phase by phase — Phase 1 tables first, so you can start building and testing immediately rather than waiting for every table to exist.
3. Enable Row Level Security and apply the policies from Section 4 — do this *before* writing any app code, not after.
4. Enable Supabase Auth (email/password).
5. Create a Storage bucket for media (needed by Phase 2, fine to set up now).
6. Save your Project URL and anon key for Step 2.

### Step 2 — Local project setup
1. Create a new folder, scaffold a Next.js project inside it.
2. `git init`, create a matching private GitHub repo, push immediately.
3. Write `CLAUDE.md` at the project root — include the WI compliance rules, the full data model, the phase list from Section 2, and the "AI drafts, human confirms" principle so Claude Code applies it consistently across every AI-touching feature.
4. Create `.env.local` with your Supabase URL/key; confirm `.gitignore` excludes it.
5. Install the Supabase JS client and Supabase's Next.js auth helpers.

### Step 3 — Build with Claude Code, in phase order
Work through Section 2's phases in order. After each phase: run locally (`npm run dev`), click through it yourself, commit to git. Small, working commits per feature — not one giant commit at the end.

### Step 4 — Google Calendar setup (before Phase 2.5)
1. Create a Google Cloud project (console.cloud.google.com), enable the Google Calendar API.
2. Configure the OAuth consent screen (internal/testing mode is fine for personal use).
3. Create OAuth 2.0 credentials, add your app's URL as an authorized redirect.
4. Store the client ID/secret as environment variables, same pattern as Supabase's.
5. Build the one-way sync (app → Google) as scoped in Phase 2.5 — resist the urge to build two-way sync now.

### Step 5 — Deploy to Vercel
1. Import your GitHub repo into Vercel.
2. Add all environment variables (Supabase, Google OAuth, Anthropic API key for AI features) in Vercel's dashboard — separately from your local `.env.local`.
3. Deploy. Every future push to your main branch auto-redeploys.

### Step 6 — Connect your GoDaddy domain
Follow Section 5. Do this once Phase 1 is live and working on the default `.vercel.app` URL — no need to wait for every phase to be finished first.

### Step 7 — Add your wife's account, then later the kids'
1. Once Phase 1 is deployed, create her Supabase Auth login and set her `profiles.household_role` to `co-owner`.
2. When you're ready for student access (any time after Phase 1.75, once individual student data is rich enough to be worth their login), create student accounts with `household_role = student` and `linked_student_id` set — no schema migration needed, this was designed in from the start.

---

## 7. Build Order Checklist

- [x] Phase 1 — MVP
- [x] Phase 1.5 — Curriculum + Checklist
- [x] Phase 1.75 — Differentiators (standards, unit study, pacing radar, peer-teaching, shared logs)
- [x] Phase 1.9 — Account & Access Management
- [x] Phase 2 — Portfolio, Media & Trips
- [ ] Phase 2.5 — Calendar + Google Calendar one-way sync *(App UI built; Google Cloud setup deferred by user)*
- [x] Phase 3 — AI-Assisted Grading + closed-loop mastery pacing
- [ ] Phase 4 — Transcript System
- [x] Phase 5 — Year-End Portfolio (PDF + highlight slideshow)
- [ ] GoDaddy domain connected
- [ ] Wife's co-owner account added
- [ ] Student accounts added (when ready)
