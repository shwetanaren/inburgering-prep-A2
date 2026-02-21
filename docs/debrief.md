# Inburgering Prep — Approach Debrief

This is a short debrief of the approach used to build the Inburgering Prep app, so it can be reused as a template for future projects.

## 1) Product framing

- Clear, narrow outcome: "8 weeks, 45–90 min/day to pass A2 inburgering."
- Offline-first requirement to ensure reliability in real-world contexts.
- Focused MVP scope: SRS, daily plan, progress, offline content.
- Explicit non-goals (no heavy media, no auth/sync, no AI at launch).

## 1.1) Multi-agent doc pipeline (PRD → contracts → build)

- Start with a single source of truth: `docs/prd/agent_prd .md`.
- Derive specialized documents in sequence:
  - UX/flows: `docs/prd/ux_flows.md`
  - Content schema: `docs/prd/content_spec.md`
  - Data contract: `docs/prd/data_contract.md`
  - UI/backend mapping: `docs/prd/ui_backend_mapping.md`
- Each document has a clear owner (design, content, API/data, coding) and
  explicit constraints to prevent scope drift and data loss.
- This creates a clean handoff chain: PRD → data contract → content → UX → UI mapping → implementation.

## 1.2) External agent coordination (UI + wiring)

- The UI design agent (Stitch) consumes the UX + content + data contract docs.
- We ensure consistency by:
  - Providing the latest PRD pack to the UI agent before any screen is built.
  - Mapping UI elements to services via `ui_backend_mapping.md`.
  - Verifying screens only use data that exists in the content schema and data contract.
- The wiring agent uses the mapping to connect screens to service calls without
  inventing new data fields or flows.

  ( Example prompt to claude who did this intermeidate step: Create /docs/prd/ui_contract_pack.md for a non-Codex UI agent (Stitch).
  Source files: - /docs/prd/ux_flows.md - /docs/prd/ui_backend_mapping.md - /packages/services/dtos.ts
  Scope: - key MVP screens: Home, Review, Lesson, Dialogue, Progress, Settings.
  Output must be short and design-oriented (max ~2 pages): 1) For each MVP screen: - MUST fields (minimum needed to render) - OPTIONAL fields (nice-to-have) - IGNORE fields (backend-only / not for UI) - Primary CTA + secondary actions 2) Component inventory (reusable components with 1-line purpose each) 3) Required states per screen: loading / empty / error / offline banner / saved indicator 4) Sample mock JSON payloads per screen (small, realistic) matching DTOs
  Keep it accurate so Stitch doesn’t over-design irrelevant fields.
  Do not include database details, migrations, or implementation notes.

      Consider the screenshot as the starting screen...and the UI/UX design should continue from hereon by stitch...I need you to be the contract agent who can guide stitch to move from here to the next set of screens also keeping UI/UX in mind.

      Can you help me give the exact input to stitch...so it can design right tabs, screens, flows, layouts etc...I also have few more smaple screens if you need and the source files. Would you be able to give me just an outline or wireframes for this MVP? So I can feed it to stitch to evolve the UI. I have no issues with UI ability of stitch ...but it doesn't know which field to keep on each screen and UX between screens...this is a step I need translation help from technical to something that stitch can stitch as per my app design.)

## 1.3) Handoff checklist (agent to agent)

- PRD → UX
  - Scope and non-goals are explicit and testable.
  - Primary flow ("what to do today") is defined end-to-end.
  - Offline-first constraints are called out with UI impact.
  - Success metrics are stated (daily completion, streak, queue).
- UX → Content
  - Every screen maps to a content type (words, lessons, dialogues).
  - Each action has content and microcopy defined.
  - Empty/offline/error states are documented per screen.
  - Week/tier pacing is explicit (8-week structure).
- Content → Data Contract
  - Stable, versioned IDs across all content.
  - Schema includes all UI fields and metadata.
  - Validation rules for content packs are defined.
  - Content can be loaded without network and without migrations.
- Data Contract → UI Mapping
  - Each screen has a named data source and service call.
  - DTO fields match schema exactly (no ad-hoc fields).
  - Cross-screen state (streak, progress, queues) is normalized.
  - Error cases are defined (missing content, empty queues).
- UI Mapping → Implementation
  - Services match mapping; no direct JSON access in UI.
  - Transactions used for state updates (no data loss).
  - Loading/error/empty states wired and verified.
  - Performance tested on low-end devices.

## 1.4) Artifacts per handoff (foolproof)

- PRD handoff
  - `docs/prd/agent_prd .md`
  - 1-page summary (problem, outcome, non-goals, constraints)
- UX handoff
  - `docs/prd/ux_flows.md` (navigation map + screen flow + state matrix)
  - Component inventory (reusable UI pieces)
- Content handoff
  - `docs/prd/content_spec.md`
  - Seed content in `content/vX.Y.Z/`
- Data contract handoff
  - `docs/prd/data_contract.md`
  - Migration strategy notes
- UI mapping handoff
  - `docs/prd/ui_backend_mapping.md`
  - Service DTO list (inputs/outputs)
- Implementation handoff
  - Screens connected to services
  - Progress tab, review queue, streaks all verified

## 2) System pillars

- **Offline-first**: all functionality works without network.
- **Deterministic SRS**: predictable scheduling and never lose progress.
- **Stable content IDs**: content updates do not break user state.
- **Migration-safe**: schema changes are versioned and backwards compatible.

## 3) Data architecture (local-first)

- SQLite (`expo-sqlite`) as the single source of truth.
- Content is bundled (JSON) and versioned.
- User state is stored in SQLite:
  - `srs_state` (derived fast state)
  - `reviews_log` (append-only source of truth)
  - `lesson_progress`, `app_state`, `user_settings`
- Write path:
  - Review event -> `reviews_log`
  - Derived state -> `srs_state`
  - Transactional writes to avoid data loss

## 4) UI architecture

- Expo Router for navigation.
- Reusable UI primitives (Card, Screen, StateViews).
- Safe area on all screens.
- Clear empty/loading/error states everywhere.
- Offline banner and defensive UX for low connectivity.

## 5) Content strategy

- Versioned content packs (e.g., `content/v1.0.0`).
- Stable IDs across packs for words/lessons/dialogues.
- Content schema defined upfront (data contract).

## 6) Progress/analytics model

- Weekly activity computed from review logs.
- "All-time" is a UI concept; for an 8-week program, recent data matters most.
- Lightweight pruning plan:
  - Keep 90 days of raw logs.
  - Label as "Last 90 days activity".

## 7) Tech stack summary

- Expo (latest stable SDK)
- Expo Router
- NativeWind (Tailwind for RN)
- `expo-sqlite` for offline DB
- `expo-image`, `react-native-safe-area-context`

## 8) Build rhythm that worked

1. Lock the PRD and the non-goals.
2. Define data contract and content schema first.
3. Build offline-first data services.
4. Wire UI screens to the services.
5. Add UX polish (empty/loading/offline).
6. Only then consider optional features (audio, AI, sync).

## 9) Pitfalls we avoided

- No backend dependencies for MVP.
- No auth complexity before the product proves value.
- No large media downloads early.
- No content ID changes that would invalidate progress.

## 10) Reusable checklist for next project

- Confirm platform + offline/online requirements.
- Write a 1-page PRD + explicit non-goals.
- Define local data contract + schema.
- Build content pack with stable IDs.
- Create minimal UI flow with real data.
- Validate progress tracking and pruning strategy.
- Measure performance on low-end devices.

## 11) Optional future extensions

- Audio caching (opt-in, on demand).
- Cloud sync (Supabase).
- Purchases (RevenueCat, no-auth initially).
- AI corrections (feature flag).

Note:

Best default (for offline‑first/data‑sensitive apps like this one):
PRD → Data Contract → Content → UX → UI Mapping → Implementation
Reason: locking schema and IDs early prevents later rework and protects progress data.

Best default (for UI‑led products or uncertain flows):
PRD → UX → Content → Data Contract → UI Mapping → Implementation
Reason: flows stabilize first, then data is designed to serve the UX.

If you want a rule of thumb:

Data‑critical / offline / regulated → start with data contract.
Experience‑critical / discovery / marketing → start with UX.
