# Inburgering Prep (Expo) — Agentic PRD v0

## 0) One-line promise

8 weeks, 45–90 min/day: help learners pass **A2 inburgering** with **SRS + vocabulary + dialogues + real-life exchanges** — offline-first.

## 1) Problem

Adult immigrants in NL struggle to study consistently for A2/inburgering because:

- vocabulary fades quickly without a reliable review system
- practice is not “real-life shaped” (gemeente, doctor, supermarket)
- learning tools break when offline or lose progress → users quit
- content updates often break learned progress (IDs change, migrations missing)

## 2) Goals (MVP → v1)

### Must achieve

1. **Bulletproof SRS**: never lose user progress; predictable daily queues
2. **Offline-first**: 100% usable without internet after install
3. **8-week structure**: clear weekly pacing + daily sessions (45–90 min)
4. **Real-world exchanges**: dialogues + writing tasks aligned to everyday NL situations
5. **Clean UX**: actionable chunks, realistic expectations, visual breaks

### Nice-to-have (later)

- AI correction for writing/speaking prompts (rate-limited + cached)
- Audio for dialogues (stream/cached on demand)
- Cloud sync / backup

## 3) Non-goals (for v0/v1)

- Full B1 program
- Live tutoring / community features
- Heavy gamification
- Streaming large media assets offline by default

## 4) Users & key jobs

### Primary user

A2 learner preparing for inburgering while working/studying; learns on trains/waiting rooms.

### Jobs-to-be-done

- “Tell me what to do today” (queue + lesson)
- “Help me remember words long-term”
- “Train me for real interactions”
- “Let me see I’m progressing”
- “Don’t break when offline / don’t lose my work”

## 5) Product shape (Three-tier learning model)

### Tier I: Vocabulary (Weeks 1–2)

- Topic-based lists aligned with KNM themes (healthcare, work, housing, government)
- de/het patterns
- common prepositions
- SRS drills (daily)

### Tier II: Sentences (Weeks 3–5)

- Pattern A & B first (daily fluency)
- Pattern C: questions for real interactions
- Pattern D/E: connecting ideas
- Scaffolded exercises per pattern module

### Tier III: Real-life exchanges (Weeks 6–8)

- scenario dialogues (doctor, gemeente, supermarket, etc.)
- writing tasks (formal emails / informal messages)
- speaking prompts (if voice later)
- grammar patterns inside context

## 6) Platforms & constraints

- Cross-platform mobile via **Expo (React Native)**
- Offline-first using **SQLite (expo-sqlite)**
- Content bundled + versioned; later OTA updates via EAS Update
- No account required for MVP

## 7) System overview

### Inputs

- Bundled content pack (vocab, exercises, dialogues) with semantic content version
- User actions (reviews, lesson completions, writing submissions)

### Outputs

- Daily plan + SRS queue
- Completed lessons, streak, progress metrics
- Dialogue practice + writing outputs
- Exportable backup (later)

### Tools / services (optional later)

- AI correction provider (rate-limited) behind feature flag
- Analytics (privacy-preserving, optional)

## 8) Agent team (roles, responsibilities, outputs)

### 8.1 Orchestrator (Human + Codex runner)

**Mission:** enforce PRD contract, decide tradeoffs, approve risky ops.
**Responsibilities**

- Define MVP scope, accept/reject agent outputs
- Maintain /docs/decisions.md
- Ensure guardrails respected (offline, privacy, no data loss)
  **Outputs**
- Updated PRD decisions + releases
- Final merges

---

### 8.2 Design & Experience Agent

**Mission:** design the flows so daily learning feels simple + structured.
**Inputs**

- This PRD
- Content structure (weeks, tiers)
  **Outputs (files)**
- `/docs/prd/ux_flows.md` including:
  - navigation map
  - screen-by-screen flow (happy + edge)
  - state matrix (empty/loading/error/offline)
  - component inventory (reusable UI pieces)
    **Constraints**
- Must be achievable in Expo
- Must highlight “today’s plan” and “saved/offline status”
- No fluff: every screen maps to a user action

---

### 8.3 Content Agent

**Mission:** produce consistent, A2-aligned learning content + microcopy.
**Inputs**

- UX flows
- Content schema requirements
  **Outputs**
- `/docs/prd/content_spec.md` (schemas + ID rules + validation rules)
- `/content/v1.0.0/...` seed content for MVP
- Microcopy per screen and error states
  **Constraints**
- Stable IDs forever (no breaking renames)
- A2-level sentences; consistent tone
- Avoid legal promises; avoid cultural assumptions

---

### 8.4 API Agent (Local-first + future sync contracts)

**Mission:** design the data layer + service API that keeps SRS and progress safe.
**Inputs**

- UX flows + content spec
  **Outputs**
- `/docs/prd/data_contract.md` including:
  - SQLite schema (tables, fields, relations)
  - indexes (esp. `nextReview`)
  - migrations strategy (schema + content)
  - local service function signatures
  - future cloud sync contract draft (optional)
    **Constraints**
- Offline-first always
- Atomic writes for review events
- Migration-safe and backwards compatible

---

### 8.5 Coding Agent (Codex-driven)

**Mission:** implement the app according to contracts; keep code clean + testable.
**Inputs**

- UX flows
- data_contract + content_spec
  **Outputs**
- Expo app implementation:
  - SQLite + migrations
  - SRS engine module (pure functions)
  - content loader + versioning
  - screens + navigation
  - error boundaries + offline UI states
- PR-style summary of changes
  **Constraints**
- No secrets in repo
- Feature flags for optional AI integration
- Tests must pass before “done”

---

### 8.6 Testing Agent

**Mission:** prevent the 3 failure modes: SRS wrong, data loss, content update break.
**Inputs**

- PRD + contracts + code
  **Outputs**
- `/docs/prd/eval_plan.md` (manual + automated)
- unit tests for SRS
- integration tests for persistence + queue generation
- migration tests for schema/content updates
  **Constraints**
- Must include “crash mid-session” persistence checks
- Must include “offline for 3 days” queue behavior
- Must include “content v1.0.0 → v1.1.0” migration checks

## 9) Architecture decisions (v0)

### 9.1 Storage

- SQLite via expo-sqlite
- Tables:
  - `words` (content)
  - `srs_state` (per word user state)
  - `reviews_log` (append-only events)
  - `lesson_progress` (weeks/modules)
  - `app_state` (streak, goals, content version)

### 9.2 SRS algorithm (MVP)

Leitner-style boxes (deterministic).

- Boxes 1–5 with intervals: 1, 3, 7, 14, 30 days (configurable)
- Ratings: again/good/easy
- Daily queue:
  - `nextReview <= today`
  - order by `nextReview asc`
  - cap at 30
  - optional fill with new words if under cap

### 9.3 Content versioning

- Content pack is versioned `vX.Y.Z`
- Content updates must not break IDs
- Migration scripts handle:
  - schema version bumps
  - content patching (typos/examples) without breaking SRS links
- Later: OTA updates for content (EAS Update)

## 10) Guardrails (constraints + governance)

### Safety & privacy

- Offline-first; no forced account
- No collection of personal data in MVP
- If AI correction added:
  - rate limit (e.g., 10/day)
  - cache common corrections
  - never send user identifiers; sanitize inputs

### Data integrity

- All review writes are transactional
- Reviews are append-only (log) + derived state updates
- Crash-safe saving:
  - critical actions saved immediately
  - non-critical batched

### Change management

- All behavior changes require PRD update + version bump
- `/docs/decisions.md` must record:
  - SRS interval changes
  - schema changes
  - content migration notes

## 11) Success metrics (v1)

### Quality

- Day-7 retention ≥ target (set later)
- “Lost progress” bug reports: 0 tolerated
- Queue correctness: 99%+ in tests

### Learning outcomes (proxy)

- Streak consistency
- Words “mastered” per week
- Dialogue completion rate
- Self-assessed confidence (simple weekly check-in)

### Performance

- App “time to interactive” < 200ms after first load (goal)
- Queue generation < 100ms for 450 words

### Cost (if AI later)

- avg AI calls/user/day within budget
- cache hit rate for common mistakes

## 12) MVP scope (first shippable)

- Week 1 content only (small but complete loop)
- Screens:
  - Home (today plan + due words)
  - Review (SRS loop)
  - Lesson (vocab + simple drills)
  - Dialogue (one scenario)
  - Progress (streak + stats)
  - Settings (daily goal)
- No AI correction, no audio, no cloud sync

## 13) Definition of done (per feature)

- UX flow updated
- Data contract updated if needed
- Tests added/updated
- Works fully offline
- No regressions in SRS + migrations
- Docs updated (what changed + why)
