# UX Flows (MVP v0)

## SDD Analysis
Platform is iOS/Expo. Proceeding with Expo-first blueprint. This deliverable is documentation-only.

## MVP Screens
- Home (Today plan)
- Review session
- Lesson (Week 1 vocab)
- Dialogue (1 scenario)
- Progress
- Settings
- Session Summary (shared modal/screen after Review/Lesson/Dialogue)

## Navigation Map
- Bottom tabs
- Home
- Review
- Lesson
- Dialogue
- Progress
- Settings

- Stack overlays (from any tab)
- Session Summary
- Error Boundary
- Offline Banner (global overlay)

## State Matrix (Empty / Loading / Error / Offline / Saved)

State definitions apply across all screens and are driven by local SQLite reads and writes per `data_contract.md`.

### Home (Today plan)
- Empty: No content loaded (`content_meta` missing). CTA: "Load content".
- Loading: Skeleton for Today plan, Due queue, Week progress.
- Error: Content load failed. CTA: "Retry".
- Offline: Banner only; use bundled content and local state.
- Saved: Toast after returning from a completed session.

### Review session
- Empty: No due words (`srs_state.next_review_at <= now` yields none). CTA: "Start Lesson".
- Loading: Queue build spinner.
- Error: Queue build failed (DB error). CTA: "Retry".
- Offline: Banner only; `reviews_log` writes local.
- Saved: Per-card "Saved" tick after `recordReview` transaction.

### Lesson (Week 1 vocab)
- Empty: No Week 1 lesson content (`lessons` / `words` missing). CTA: "Reload content".
- Loading: Lesson skeleton steps.
- Error: Lesson load failed. CTA: "Retry".
- Offline: Banner only.
- Saved: Step completion saved to `lesson_progress`.

### Dialogue (1 scenario)
- Empty: No dialogue content (`dialogues` missing). CTA: "Back".
- Loading: Dialogue skeleton.
- Error: Dialogue load failed. CTA: "Retry".
- Offline: Banner only.
- Saved: Not tracked in MVP (practice-only). Show a local toast, but do not persist completion.

### Progress
- Empty: No progress yet (`reviews_log` empty). CTA: "Start Review".
- Loading: Stats skeleton.
- Error: Stats load failed. CTA: "Retry".
- Offline: Banner only.
- Saved: Read-only; show last updated timestamp from `app_state`.

### Settings
- Empty: Not applicable.
- Loading: Settings skeleton rows.
- Error: Settings load failed. CTA: "Retry".
- Offline: Banner only.
- Saved: "Goal saved" toast after `updateUserSettings`.

## Happy Path + Edge Cases (Per Screen)

### Home (Today plan)
- Happy
- App loads content + state (`content_meta`, `srs_state`, `lesson_progress`, `app_state`).
- Today plan shows: due reviews, Week 1 lesson step, dialogue link.
- User navigates to Review or Lesson.

- Edge
- First launch: content not yet loaded → Empty state.
- Missing/failed content update: Error state with retry.
- Offline: Banner visible, all data local.

### Review session
- Happy
- Build queue: due words from `srs_state` ordered by `next_review_at`.
- Show first card; user rates again/good/easy.
- `recordReview` transaction writes `reviews_log` + updates `srs_state` + `app_state`.
- Advance to next card until done.
- Session Summary appears.

- Edge
- No due words: Empty state with CTA to Lesson.
- Save failure: inline error + retry; do not advance card.
- App crash mid-session: on relaunch, last completed review is persisted; resume at next card.

### Lesson (Week 1 vocab)
- Happy
- Load Week 1 vocab lesson from `lessons` + `words`.
- Step through: intro → vocab list → mini drill.
- Save progress per step to `lesson_progress`.
- Session Summary appears.

- Edge
- Lesson missing: Empty/Error state.
- User exits mid-lesson: resume last step via `lesson_progress`.
- Offline: Banner only.

### Dialogue (1 scenario)
- Happy
- Load dialogue script from `dialogues`.
- Show lines + quick prompt.
- Completion is practice-only (no persistence in MVP).
- Session Summary appears (based on local session data only).

- Edge
- Dialogue missing: Empty/Error state.
- Offline: Banner only.

### Progress
- Happy
- Show streak and counts (from `app_state` + `reviews_log`).

- Edge
- No data yet: Empty state CTA.

### Settings
- Happy
- Update daily goal (`user_settings.daily_goal`).
- Saved toast confirms.

- Edge
- Save fails: error toast and revert UI.

## Full Flow: Daily Review Loop

1. Entry
- User taps "Start Review" on Home or Review tab.

2. Queue Build
- Call `getDueQueue(limit, nowIso)`.
- If queue empty → Empty state with CTA to Lesson.

3. Review Loop
- For each card: prompt → reveal meaning → user rates `again` / `good` / `easy`.
- Call `recordReview` with rating and timestamps.
- Transaction writes `reviews_log`, updates `srs_state`, updates `app_state.last_reviewed_at`.
- Advance to next card only after successful save.

4. Session Summary
- Show reviewed count, streak update, next due time.
- CTA: "Start Lesson" or "Back to Home".

5. Edge Handling
- Save error: show inline error; allow retry without losing card state.
- Offline: no change; all writes local.
- Crash mid-loop: on relaunch, previously saved reviews remain; resume next card.

## Component Inventory (Reusable)
- TopAppBar (title, back)
- OfflineBanner
- TodayPlanCard
- ProgressRing
- StatTile
- PrimaryButton
- SecondaryButton
- ReviewCard
- RatingButtons (again/good/easy)
- LessonStepCard
- DialogueBubble
- EmptyState
- ErrorState
- SkeletonLoader
- Toast (Saved/Error)
- SessionSummaryCard
