# Data Contract — Local-First SQLite (Expo)

## 0) Scope & Principles

**Scope (MVP):** Offline-first Expo app using SQLite (`expo-sqlite`) with bundled content and local progress only. No auth, no sync. AI correction is out of scope and should be feature-flagged later.

**Principles**
- **No data loss:** User progress is always written locally and never overwritten by content updates.
- **Append-only reviews:** Every review produces a durable event in `reviews_log`.
- **Deterministic SRS:** `next_review_at` derives from review events and SRS rules.
- **Migration-safe:** Schema and content migrations are versioned and backwards compatible.
- **Offline-first:** All user flows work without network access.

## 1) Database Overview

- SQLite via `expo-sqlite`.
- **Content** tables are bundled + versioned. **User state** is derived from events and stored for fast queries.
- **Atomic writes:** review event + derived `srs_state` updates in a single transaction.

### 1.1 Entities (MVP)

**Content (immutable per version)**
- `content_meta`
- `words`
- `lessons`
- `dialogues`
- `exercises` (optional for v1 if included)

**User State (mutable)**
- `srs_state`
- `reviews_log`
- `lesson_progress`
- `user_settings`
- `app_state`

## 2) Schema (SQLite)

All tables use `INTEGER PRIMARY KEY` (rowid) where appropriate. Timestamps are stored as **ISO 8601 strings** in UTC (e.g., `2026-02-19T10:30:00Z`) and **epoch milliseconds** (`*_ts`) for fast queries and stable ordering.

### 2.1 `content_meta`
Stores bundled content pack metadata.

```sql
CREATE TABLE IF NOT EXISTS content_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content_version TEXT NOT NULL,          -- vX.Y.Z
  build_hash TEXT NOT NULL,               -- hash of bundled content files
  installed_at TEXT NOT NULL              -- ISO UTC
);
```

### 2.2 `words`
Vocabulary items. **IDs are stable forever** across content updates.

```sql
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,                    -- stable content ID (e.g., "w_000123")
  week INTEGER NOT NULL,
  topic TEXT NOT NULL,
  lemma TEXT NOT NULL,                    -- base word
  article TEXT,                           -- "de" / "het" / null
  translation TEXT NOT NULL,
  example_nl TEXT,
  example_en TEXT,
  audio_uri TEXT,                         -- optional future use
  tags TEXT,                              -- JSON array string
  is_active INTEGER NOT NULL DEFAULT 1,   -- allow soft-deprecations
  updated_at TEXT NOT NULL                -- ISO UTC from content pack
);
```

### 2.3 `lessons`
Weekly modules and lesson units.

```sql
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,                    -- stable content ID
  week INTEGER NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,                     -- "vocab" | "sentence" | "dialogue"
  order_index INTEGER NOT NULL,
  payload TEXT NOT NULL,                  -- JSON with lesson content refs
  updated_at TEXT NOT NULL
);
```

### 2.4 `dialogues`
Scenario dialogues (week 6–8 in full product).

```sql
CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  scenario TEXT NOT NULL,
  title TEXT NOT NULL,
  lines TEXT NOT NULL,                    -- JSON array of line objects
  updated_at TEXT NOT NULL
);
```

### 2.5 `exercises` (optional in MVP)
Pattern drills or writing prompts.

```sql
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  kind TEXT NOT NULL,                     -- "fill" | "order" | "write" etc.
  prompt TEXT NOT NULL,
  data TEXT NOT NULL,                     -- JSON payload
  updated_at TEXT NOT NULL
);
```

### 2.6 `srs_state`
Per-word state for fast queue generation. Derived from review events but stored for performance.

```sql
CREATE TABLE IF NOT EXISTS srs_state (
  word_id TEXT PRIMARY KEY REFERENCES words(id) ON DELETE CASCADE,
  box INTEGER NOT NULL DEFAULT 1,         -- 1..5
  next_review_at TEXT NOT NULL,           -- ISO UTC
  next_review_at_ts INTEGER NOT NULL,     -- epoch ms
  last_review_at TEXT,                    -- ISO UTC
  last_review_at_ts INTEGER,              -- epoch ms
  correct_streak INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  total_lapses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_at_ts INTEGER NOT NULL
);
```

### 2.7 `reviews_log`
Append-only review events (source of truth).

```sql
CREATE TABLE IF NOT EXISTS reviews_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id TEXT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  rating TEXT NOT NULL,                   -- "again" | "good" | "easy"
  prev_box INTEGER NOT NULL,
  next_box INTEGER NOT NULL,
  scheduled_at TEXT NOT NULL,             -- due time when shown
  scheduled_at_ts INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL,              -- actual time
  reviewed_at_ts INTEGER NOT NULL,
  latency_ms INTEGER                      -- optional UI metric
);
```

### 2.8 `lesson_progress`
Tracks user completion per lesson.

```sql
CREATE TABLE IF NOT EXISTS lesson_progress (
  lesson_id TEXT PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  profile_id TEXT,                        -- reserved for future multi-profile
  status TEXT NOT NULL,                   -- "not_started" | "in_progress" | "done"
  last_activity_at TEXT,                  -- ISO UTC
  completed_at TEXT,                      -- ISO UTC
  created_at TEXT NOT NULL,
  created_at_ts INTEGER NOT NULL
);
```

### 2.9 `user_settings`
Local preferences.

```sql
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  daily_goal INTEGER NOT NULL DEFAULT 30,
  notifications_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 2.10 `app_state`
Global app state values.

```sql
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT,                    -- ISO UTC
  last_reviewed_at TEXT,                  -- ISO UTC
  content_version TEXT NOT NULL           -- mirrors content_meta
);
```

## 3) Indexes

Indexes focused on SRS queue speed and review history.

```sql
CREATE INDEX IF NOT EXISTS idx_srs_next_review ON srs_state (next_review_at_ts);
CREATE INDEX IF NOT EXISTS idx_reviews_word_time ON reviews_log (word_id, reviewed_at_ts);
CREATE INDEX IF NOT EXISTS idx_lessons_week_order ON lessons (week, order_index);
CREATE INDEX IF NOT EXISTS idx_words_week_topic ON words (week, topic);
```

## 4) Migrations Strategy

### 4.1 Schema Versioning

- Use `PRAGMA user_version` to store schema version (integer).
- Each migration is **idempotent** and run in order at app startup.
- Migrations must be atomic: wrap each version bump in a transaction.

**Example:**

```ts
// pseudo
await db.execAsync('BEGIN');
// apply migration steps
await db.execAsync('PRAGMA user_version = 2');
await db.execAsync('COMMIT');
```

### 4.2 Content Versioning

- `content_meta.content_version` tracks bundled content.
- Content updates must **never change IDs**.
- Content patching must **not delete** user state; if content item is removed, mark it inactive (`is_active = 0`).

**Content update flow:**
1. Compare bundled content version vs `content_meta`.
2. If new:
   - Upsert content rows by stable ID.
   - Set `is_active = 1` for present items, `0` for removed items.
   - Update `content_meta` and `app_state.content_version`.

### 4.3 Backwards Compatibility

- New columns must be nullable or have defaults.
- Avoid renaming columns unless absolutely necessary.
- Keep `reviews_log` schema stable; add columns only if needed.

## 5) Atomic Review Write (Critical Path)

All review actions **must** be stored in a transaction:

1. Insert row into `reviews_log`.
2. Update `srs_state` for `word_id`.
3. Update `app_state.last_reviewed_at`.

If any step fails, the transaction rolls back to avoid partial state.

## 6) Local Service Layer (API)

A single local module wraps SQLite access and SRS logic. It exposes deterministic functions and hides SQL details from UI.

### 6.1 Module: `services/db.ts`

**Initialization**

```ts
export type DbInitResult = {
  schemaVersion: number;
  contentVersion: string | null;
};

export async function initDb(): Promise<DbInitResult>;
export async function runMigrations(): Promise<void>;
export async function loadBundledContentIfNeeded(): Promise<void>;
```

**Content Reads**

```ts
export async function getWordsByWeek(week: number): Promise<Word[]>;
export async function getWordById(id: string): Promise<Word | null>;
export async function getLessonsByWeek(week: number): Promise<Lesson[]>;
export async function getLessonById(id: string): Promise<Lesson | null>;
export async function getDialogueById(id: string): Promise<Dialogue | null>;
```

**SRS / Reviews**

```ts
export type Rating = 'again' | 'good' | 'easy';

export type ReviewInput = {
  wordId: string;
  rating: Rating;
  scheduledAt: string;  // ISO UTC
  reviewedAt: string;   // ISO UTC
  latencyMs?: number;
};

export async function getDueQueue(limit: number, nowIso: string): Promise<SrsItem[]>;
export async function getNewWords(limit: number, week: number): Promise<Word[]>;
export async function recordReview(input: ReviewInput): Promise<void>; // atomic
export async function getSrsState(wordId: string): Promise<SrsState | null>;
export async function seedSrsForWord(wordId: string, nowIso: string): Promise<void>;
```

**Progress / Stats**

```ts
export async function setLessonStatus(lessonId: string, status: LessonStatus): Promise<void>;
export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null>;
export async function getAppState(): Promise<AppState>;
export async function updateStreak(nowIso: string): Promise<void>;
```

**Settings**

```ts
export async function getUserSettings(): Promise<UserSettings>;
export async function updateUserSettings(input: Partial<UserSettings>): Promise<void>;
```

### 6.2 SRS Engine Module: `services/srs.ts`

Pure functions only; no database access.

```ts
export type SrsConfig = {
  intervalsDays: number[]; // [1,3,7,14,30]
};

export function computeNextBox(prevBox: number, rating: Rating): number;
export function computeNextReviewAt(nowIso: string, nextBox: number, config: SrsConfig): string;
```

### 6.3 Error Handling

- All DB errors are surfaced to a single error boundary.
- `recordReview` must throw on failure to ensure UI can retry.

## 7) Future Sync Contract (Draft)

**Not implemented in MVP.** Reserved columns and strategies:

- Add `sync_status` to `reviews_log` and `lesson_progress` later.
- Use **monotonic `reviewed_at` + device UUID** to deduplicate server-side.
- No PII stored.

**Draft event payload**

```json
{
  "device_id": "uuid",
  "content_version": "v1.0.0",
  "events": [
    {
      "type": "review",
      "word_id": "w_000123",
      "rating": "good",
      "prev_box": 2,
      "next_box": 3,
      "reviewed_at": "2026-02-19T10:30:00Z"
    }
  ]
}
```

## 8) Guardrails & Invariants

- `reviews_log` is append-only.
- `srs_state.word_id` must always match `words.id`.
- `content_meta` and `app_state` always have exactly one row (`id = 1`).
- No deletion of user data when content updates.
- All time calculations are UTC ISO strings.

## 9) Test Checklist (for implementation)

- Record review persists after app restart.
- Crash during `recordReview` yields no partial state.
- Queue uses `next_review_at <= now` and orders by `next_review_at ASC`.
- Content update does not break existing `srs_state`.

---

**Status:** Ready for implementation.
