# UI ↔ Backend Wiring (MVP v0)

## A) Screen → Service Calls Mapping

### Home (Today plan)
Service calls
- `initApp()` on app start (idempotent)
- `getTodayPlan(limit?)` for due queue + progress
- `listLessonsByWeek(week)` for Week card(s) and ordering
- `listDialoguesByWeek(week)` for Dialogue card
- `listExercisesByWeek(week)` optional (if UI surfaces exercises)

Inputs
- `limit` defaults to `SettingsDTO.dailyGoal` when omitted
- `week` from product context (MVP uses week 1)

Returns (UI-ready)
- `getTodayPlan` returns `{ queue: TodayQueueItemDTO[]; progress: ProgressDTO }`
- `listLessonsByWeek` returns `LessonSummaryDTO[]`
- `listDialoguesByWeek` returns `DialogueSummaryDTO[]`

Loading/Error/Offline/Saved
- Loading: while `initApp` and `getTodayPlan` are pending
- Error: any thrown error from service call
- Offline: banner only (all data is local); UI uses network state, not services
- Saved: use `ReviewResultDTO.progress` after a review session completes to show toast

### Review session
Service calls
- `getReviewQueue(limit?)` to build queue
- `recordReview(wordId, rating, scheduledAtIso?)` for each card

Inputs
- `limit` defaults to `SettingsDTO.dailyGoal` when omitted
- `scheduledAtIso` should be the item’s `state.nextReviewAt` from the queue

Returns (UI-ready)
- `getReviewQueue` returns `TodayQueueItemDTO[]`
- `recordReview` returns `ReviewResultDTO` (includes updated `ProgressDTO`)

Loading/Error/Offline/Saved
- Loading: while queue builds
- Error: service throws (DB errors surfaced)
- Offline: banner only; writes are local
- Saved: on successful `recordReview` (use `ReviewResultDTO.state` + `progress`)

### Lesson (Week 1 vocab)
Service calls
- `getLesson(lessonId)` to render lesson
- `setLessonProgress(lessonId, status)` after step completion

Inputs
- `lessonId` from `listLessonsByWeek`
- `status` in `"not_started" | "in_progress" | "done"`

Returns (UI-ready)
- `getLesson` returns `LessonDTO | null` (null means missing content)
- `setLessonProgress` returns updated `LessonProgressDTO`

Loading/Error/Offline/Saved
- Loading: while `getLesson` is pending
- Empty: `getLesson` returns `null`
- Error: thrown error from service call
- Offline: banner only
- Saved: after `setLessonProgress` resolves

### Dialogue (1 scenario)
Service calls
- `getDialogue(dialogueId)` to render dialogue

Inputs
- `dialogueId` from `listDialoguesByWeek`

Returns (UI-ready)
- `getDialogue` returns `DialogueDTO | null` (null means missing content)

Loading/Error/Offline/Saved
- Loading: while `getDialogue` is pending
- Empty: `getDialogue` returns `null`
- Error: thrown error from service call
- Offline: banner only
- Saved: practice-only; show local toast but do not persist in MVP

### Progress
Service calls
- `getProgress()` for streaks + counts

Returns (UI-ready)
- `getProgress` returns `ProgressDTO`

Loading/Error/Offline/Saved
- Loading: while `getProgress` is pending
- Empty: `ProgressDTO.totalReviews === 0`
- Error: thrown error from service call
- Offline: banner only
- Saved: read-only; show `ProgressDTO.lastReviewedAt`

### Settings
Service calls
- `getSettings()` to load
- `updateSettings(patch)` to save

Inputs
- `patch` is `Partial<SettingsDTO>`

Returns (UI-ready)
- `getSettings` returns `SettingsDTO`
- `updateSettings` returns updated `SettingsDTO`

Loading/Error/Offline/Saved
- Loading: while `getSettings` is pending
- Error: thrown error from service call
- Offline: banner only
- Saved: after `updateSettings` resolves

### Session Summary (modal/screen)
Service calls
- Review summary: use `ReviewResultDTO.progress` from last review
- Lesson/Dialogue summary: use `LessonProgressDTO` returned by `setLessonProgress`

## B) Service Call → DB Mapping

### `initApp()`
- Reads: `content_meta`, `app_state`, `user_settings`
- Writes: `content_meta`, `words`, `lessons`, `dialogues`, `exercises`, `srs_state`, `app_state`

### `getTodayPlan(limit?)`
- Reads: `srs_state`, `words`, `reviews_log`, `app_state`, `user_settings`

### `getReviewQueue(limit?)`
- Reads: `srs_state`, `words`

### `recordReview(wordId, rating, scheduledAtIso?)`
- Reads: `srs_state`, `app_state`
- Writes: `reviews_log` (append-only), `srs_state`, `app_state`

### `getLesson(lessonId)`
- Reads: `lessons`, `words`, `lesson_progress`

### `listLessonsByWeek(week)`
- Reads: `lessons`, `lesson_progress`

### `getDialogue(dialogueId)`
- Reads: `dialogues`

### `listDialoguesByWeek(week)`
- Reads: `dialogues`

### `listExercisesByWeek(week)`
- Reads: `exercises`

### `getProgress()`
- Reads: `reviews_log`, `srs_state`, `app_state`, `user_settings`

### `getSettings()`
- Reads: `user_settings`

### `updateSettings(patch)`
- Reads: `user_settings`
- Writes: `user_settings`

### `setLessonProgress(lessonId, status)`
- Writes: `lesson_progress`

## C) Content → DB Import Mapping

### `content/v1.0.0/words.json` → `words`
- `id` → `words.id`
- `week` → `words.week`
- `topic` → `words.topic`
- `lemma` → `words.lemma`
- `article` → `words.article`
- `translation` → `words.translation`
- `example_nl` → `words.example_nl`
- `example_en` → `words.example_en`
- `audio_uri` → `words.audio_uri`
- `tags` (array) → `words.tags` (TEXT via `JSON.stringify`)
- `is_active` → `words.is_active`
- `updated_at` → `words.updated_at`

### `content/v1.0.0/lessons.json` → `lessons`
- `id` → `lessons.id`
- `week` → `lessons.week`
- `title` → `lessons.title`
- `kind` → `lessons.kind`
- `order_index` → `lessons.order_index`
- `payload` (object) → `lessons.payload` (TEXT via `JSON.stringify`)
- `updated_at` → `lessons.updated_at`

### `content/v1.0.0/dialogues.json` → `dialogues`
- `id` → `dialogues.id`
- `week` → `dialogues.week`
- `scenario` → `dialogues.scenario`
- `title` → `dialogues.title`
- `lines` (array) → `dialogues.lines` (TEXT via `JSON.stringify`)
- `updated_at` → `dialogues.updated_at`

### `content/v1.0.0/exercises.json` → `exercises`
- `id` → `exercises.id`
- `week` → `exercises.week`
- `kind` → `exercises.kind`
- `prompt` → `exercises.prompt`
- `data` (object) → `exercises.data` (TEXT via `JSON.stringify`)
- `updated_at` → `exercises.updated_at`

## D) Drift Report (Critical)

### Mismatch 1: Dialogue line shape (content spec vs importer)
- Issue: `content_spec.md` defines `lines` with `{ speaker, nl, en }`, but importer validation expected `{ speaker, text }`.
- Fix applied: updated content validation + types to accept `{ speaker, nl, en }`.

### Mismatch 2: `words.is_active` ignored during import
- Issue: importer always set `is_active = 1`, ignoring the content pack field.
- Fix applied: importer now stores `is_active` from content pack.

### Mismatch 3: UI needs parsed JSON but services returned raw TEXT
- Issue: `tags`, `payload`, `lines`, `data` were stored as JSON strings, but no UI-safe DTOs existed.
- Fix applied: added `dtos.ts` and `ui.ts` that parse JSON into UI-ready DTOs.

### Mismatch 4: Streak fields never updated
- Issue: `app_state.streak_current` and `streak_best` were never updated on review.
- Fix applied: `reviewWord` now updates streaks inside the same transaction as `reviews_log` and `srs_state`.

### Mismatch 5: Dialogue completion stored in `lesson_progress`
- Issue: UX originally expected dialogue completion to be stored in `lesson_progress`, but the table’s foreign key references `lessons(id)` only.
- Minimal fix for MVP: mark dialogues as practice-only and do not persist completion. Show a local toast and Session Summary based on session data only.
- Future option: add a `dialogue_progress` table or relax the FK if persistent tracking is required later.
