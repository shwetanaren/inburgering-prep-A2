export const SCHEMA_VERSION = 3;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS content_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content_version TEXT NOT NULL,
  build_hash TEXT NOT NULL,
  installed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  topic TEXT NOT NULL,
  lemma TEXT NOT NULL,
  article TEXT,
  translation TEXT NOT NULL,
  example_nl TEXT,
  example_en TEXT,
  audio_uri TEXT,
  tags TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  scenario TEXT NOT NULL,
  title TEXT NOT NULL,
  lines TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  kind TEXT NOT NULL,
  prompt TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS srs_state (
  word_id TEXT PRIMARY KEY REFERENCES words(id) ON DELETE CASCADE,
  box INTEGER NOT NULL DEFAULT 1,
  next_review_at TEXT NOT NULL,
  next_review_at_ts INTEGER NOT NULL,
  last_review_at TEXT,
  last_review_at_ts INTEGER,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  total_lapses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_at_ts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id TEXT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  rating TEXT NOT NULL,
  prev_box INTEGER NOT NULL,
  next_box INTEGER NOT NULL,
  scheduled_at TEXT NOT NULL,
  scheduled_at_ts INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL,
  reviewed_at_ts INTEGER NOT NULL,
  latency_ms INTEGER
);

CREATE TABLE IF NOT EXISTS srs_state_content (
  content_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  box INTEGER NOT NULL DEFAULT 1,
  next_review_at TEXT NOT NULL,
  next_review_at_ts INTEGER NOT NULL,
  last_review_at TEXT,
  last_review_at_ts INTEGER,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  total_lapses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_at_ts INTEGER NOT NULL,
  PRIMARY KEY (content_id, kind)
);

CREATE TABLE IF NOT EXISTS reviews_log_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  rating TEXT NOT NULL,
  prev_box INTEGER NOT NULL,
  next_box INTEGER NOT NULL,
  scheduled_at TEXT NOT NULL,
  scheduled_at_ts INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL,
  reviewed_at_ts INTEGER NOT NULL,
  latency_ms INTEGER
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  lesson_id TEXT PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  profile_id TEXT,                        -- reserved for future multi-profile
  status TEXT NOT NULL,
  last_activity_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  created_at_ts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  daily_goal INTEGER NOT NULL DEFAULT 30,
  notifications_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  streak_current INTEGER NOT NULL DEFAULT 0,
  streak_best INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT,
  last_reviewed_at TEXT,
  content_version TEXT NOT NULL
);
`;

export const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_srs_next_review ON srs_state (next_review_at_ts);
CREATE INDEX IF NOT EXISTS idx_reviews_word_time ON reviews_log (word_id, reviewed_at_ts);
CREATE INDEX IF NOT EXISTS idx_content_next_review ON srs_state_content (next_review_at_ts);
CREATE INDEX IF NOT EXISTS idx_content_reviews ON reviews_log_content (kind, reviewed_at_ts);
CREATE INDEX IF NOT EXISTS idx_lessons_week_order ON lessons (week, order_index);
CREATE INDEX IF NOT EXISTS idx_words_week_topic ON words (week, topic);
`;
