# Homeschool Planner & Compliance App — Product Plan v3

## 0. What changed in this pass

Two research threads reshaped the plan:

1. **Standards research:** Wisconsin adopted the Common Core State Standards in 2010 for Math and English Language Arts. DPI now brands them "Wisconsin Standards," but they are Common Core underneath. Science instruction statewide (including Waunakee) runs on the Next Generation Science Standards (NGSS) instead. Social Studies, Art, and Music have their own Wisconsin-specific or locally-designed standards. This means a "standards alignment" feature needs to support **multiple frameworks**, not just Common Core.
2. **Waunakee curriculum research:** Waunakee's public K-4 curriculum pages gave real grade-level scope-and-sequence data — reading programs (Wilson Fundations, Making Meaning), writing (Being a Writer), math (Illustrative Math), and end-of-year reading benchmarks per grade. This becomes the reference point for a "parity check" feature — not to copy their curriculum, but to let you sanity-check your kids' progress against what a public-school peer would be doing at the same grade level.

---

## 1. Standards Alignment Layer

**Purpose:** Every curriculum item and lesson can optionally be tagged with the standard(s) it satisfies, across whichever framework applies to that subject.

**Design constraint:** Standards text itself (Common Core, NGSS, Wisconsin DPI standards) is copyrighted by the issuing bodies. The app stores **standard codes and short, app-written descriptions** (e.g., "K.CC.A.1 — count to 100 by ones and tens"), not verbatim reproductions of the official standard language. Full text stays linked out to the official source (thecorestandards.org for Common Core, dpi.wi.gov for Wisconsin-specific standards, nextgenscience.org for NGSS).

**Automatic tagging (refined):** rather than manually tagging each lesson, standards suggestion is automatic — when a curriculum item is added, its description is sent to the Claude API alongside the relevant slice of the `standards` reference table (filtered by subject + grade level), and it returns a suggested standard code. This appears pre-filled on the curriculum item, editable/correctable, not silently auto-committed — same "AI drafts, you confirm" pattern as the grading feature, for consistency across the app.

**Standards Coverage Checklist:** a dedicated screen, per student per subject, showing every standard for that grade level with a check mark if any logged curriculum item has been tagged to it — a live, visual "what's covered / what's not yet" view. This is the actual full-compliance checklist you asked for — much stronger evidence than hours alone if your homeschool is ever reviewed.

**Schema addition:**
- `standards` — id, framework (`common_core` / `wisconsin_dpi` / `ngss`), code, subject, grade_level, short_description
- `curriculum_item_standards` — join table, curriculum_item_id, standard_id, ai_suggested (boolean), confirmed (boolean)

**What this buys you:** a per-child, per-subject view of *which standards have been touched this year* — a much stronger compliance/progress artifact than "hours logged," and useful if you ever want your kids' credits recognized when transferring into a public or private school.

---

## 2. District Parity / Benchmark Check (new, from Waunakee research)

**Purpose:** A lightweight, optional comparison view — "how does what we're doing compare to a same-age public-school peer?" — using publicly published benchmark language, paraphrased into the app's own words, not copied curriculum.

**How it works:** the app ships with a small reference table of general grade-level expectations (e.g., a kindergarten reader typically matches spoken words to print and blends simple CVC words; a 4th grader is typically building 30 minutes of independent reading stamina and identifying author's purpose). You mark which ones your child has demonstrated, informally, whenever it's true — not a formal assessment, just a gut-check dashboard.

**Schema addition:**
- `benchmark_references` — id, grade_level, subject, description (app-authored paraphrase), source_note (e.g. "adapted from public district benchmarks")
- `benchmark_progress` — student_id, benchmark_id, status (Not Yet / Emerging / Demonstrated), date_noted

This is explicitly framed in the UI as an informal comfort-check, not a required compliance artifact — Wisconsin doesn't require this, so it should never be presented as if it's a legal necessity.

---

## 3. Feature 1 (refined): Shared-Activity Split + Multi-Grade Teaching Support

Two related problems, one feature:

**3a. Shared-activity auto-split** — log a joint field trip or read-aloud once, tag both kids, and the app generates one record per student, each mapped to grade-appropriate subjects/standards.

**3b. Unit Study Mode (new)** — addresses the real struggle of teaching two different grade levels at once. You create a single **topic** (e.g., "Frogs," "The Solar System," "Ancient Egypt"), and the app lets you attach **differentiated objectives per child** under that one topic — e.g., your younger child's objective might be "identify a frog's life cycle stages," while an older sibling's objective under the *same topic* is "explain the frog life cycle and compare it to another amphibian." Logging time against the unit study auto-splits into each child's individual `daily_logs` and (if tagged) their respective standards.

This turns the "I only have one of me and two grade levels" problem into a feature: plan once, differentiate lightly, log once.

**Starter library:** the app ships with a small set of common cross-grade unit topics (seasons, life cycles, simple machines, community helpers, geography/maps) that naturally span K–4 — pick one, and it pre-fills a topic shell you then customize per child. You can also build a fully custom unit study from scratch anytime; the library is a shortcut, not a constraint.

**Schema addition:**
- `unit_study_templates` — id, title, topic_description, subject, suggested_grade_range (seed data, read-only reference library)
- `unit_studies` — id, title, topic_description, subject_id, template_id (nullable FK — null if fully custom)
- `unit_study_objectives` — id, unit_study_id, student_id, objective_description, standard_id (optional)
- `daily_logs.unit_study_id` (nullable FK) — links a log entry back to the shared unit if applicable

---

## 4. Feature 2 (refined): Narration Capture

Refinement based on your feedback — the earlier version was just "record and transcribe." Refined version:

- Record button lives directly on a reading-log entry, not just as a standalone feature.
- After transcription (via the Claude API), the app doesn't just store raw text — it asks one lightweight follow-up: *"Want to tag which comprehension skill this shows?"* (e.g., retelling, sequencing, character understanding) — pulling from the same benchmark/standards vocabulary as sections 1–2, so a narration can double as evidence toward a reading benchmark, not just a cute keepsake.
- Narrations are stored as their own record (audio + transcript + optional skill tag), linked to a `daily_logs` entry, not bolted onto `media_attachments` — narration is evidence of *comprehension*, distinct from a photo of a worksheet.

**Schema addition:**
- `narrations` — id, student_id, log_id, audio_url, transcript_text, tagged_skill (nullable), date

---

## 5. Feature 3 (refined): Pacing & Compliance Gap Radar

Goal, per your note: help you actually **reach year-end goals**, not just track hours retroactively.

- Weekly calculation (not just year-to-date): for each required subject, compare hours-logged-so-far against a simple linear pace toward 875 hours by June 30. Flag subjects trending behind pace.
- Same logic applies to curriculum pacing (Section on Curriculum Import) — if BookShark Level A is meant to take 36 weeks and you're on week 20 with only 14 weeks of lessons checked off, you get a gentle "behind pace" flag, not a scolding one.
- Dashboard surfaces this as a simple traffic-light per subject (on pace / slightly behind / significantly behind) rather than raw numbers — quick to scan.

No new tables needed — this is a computed view over `daily_logs` + `curricula`/`curriculum_items`.

---

## 6. Feature 4: Closed-Loop Mastery Pacing

Unchanged from the earlier proposal, now explicitly connected to Section 5: once AI-assisted grading (Phase 3) exists, repeated signals of struggle on a Math-U-See lesson auto-adjust that subject's pacing forecast, so the Section 5 radar doesn't falsely flag "behind pace" when your child is legitimately still mastering a concept — mastery-paced subjects get their own pacing logic, separate from calendar-paced ones like BookShark.

**Schema addition:** `curricula.pacing_type` (`calendar` / `mastery`) — determines which pacing logic Section 5 applies.

---

## 7. Feature 5: Peer-Teaching Credit

Unchanged — a `log_type` of "Peer Teaching," creditable to both the teaching and learning child, with a note field for what was taught.

---

## 8. Feature 6 (refined): Transcript Tracking — Confirm, Don't Auto-Update

You were right to be cautious about full auto-updating. Refined design:

- A `transcripts` table holds confirmed entries only — you (or eventually your teen) explicitly add a course/credit/grade at the point it's actually finalized (e.g., end of semester), not continuously inferred from daily logs.
- The app *can* show a **draft/preview** calculation ("if current logged hours and grades hold, here's what this looks like") as a separate, clearly-labeled non-final view — but nothing writes to the actual transcript table without an explicit confirm action from you.
- This keeps the transcript itself as something you can always stand behind as a deliberate record, while still giving you the "what if" visibility you'd get from a live tracker.

**Schema addition:**
- `transcripts` — id, student_id, academic_year_id, subject_id, credit_earned, grade_mark, confirmed_date

---

## 9. Full Updated Data Model (all phases)

```
students
academic_years
subjects
daily_logs            (+ log_type: Planned/Spontaneous/Field Trip/Peer-Teaching, + unit_study_id)
curricula              (+ pacing_type: calendar/mastery)
curriculum_items
standards
curriculum_item_standards
benchmark_references
benchmark_progress
unit_studies
unit_study_objectives
narrations
media_attachments
work_samples            (Phase 3 — AI grading)
transcripts
```

---

## 10. Phased Roadmap (updated)

**Phase 1 — MVP:** students, academic years, subjects, reverse-logging, 875-hour tracker, 6-subject checklist, PI-1206 reminder, PDF export

**Phase 1.5 — Curriculum + Checklist:** manual curriculum entry (BookShark Level A, Math-U-See Alpha), pacing engine (calendar vs. mastery), "Today" checklist screen

**Phase 1.75 — Differentiators (moved earlier, cheap to build alongside 1.5):**
- Standards tagging (Section 1)
- Unit Study Mode / multi-grade teaching support (Section 3b)
- Pacing & gap radar (Section 5)
- Peer-teaching log type (Section 7)

**Phase 2 — Portfolio & Media:** photo attachments, Beginning/Middle/End board, refined narration capture (Section 4), benchmark parity check (Section 2)

**Phase 3 — AI-Assisted Grading + Closed-Loop Pacing:** photo/work-sample review with human confirm step (Section 4 tie-in), mastery pacing recalibration (Section 6)

**Phase 4 — Transcript System:** confirm-based transcript tracking (Section 8), draft/preview GPA view

---

## 11. Open questions for next session

- Do you want standards tagging to be optional per lesson (lighter touch) or prompted every time you add a curriculum item (more complete data, more friction)?
- For Unit Study Mode — do you want a library of common unit-study topics to start from, or fully blank/custom each time?
- Ready to move to the Supabase SQL schema + `CLAUDE.md` next, incorporating all of this?
