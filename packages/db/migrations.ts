import { CREATE_INDEXES_SQL, CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

export type Migration = {
  version: number;
  upSql: string;
};

export const migrations: Migration[] = [
  {
    version: 1,
    upSql: `${CREATE_TABLES_SQL}\n${CREATE_INDEXES_SQL}`,
  },
  {
    version: 2,
    upSql: `
ALTER TABLE srs_state ADD COLUMN next_review_at_ts INTEGER;
ALTER TABLE srs_state ADD COLUMN last_review_at_ts INTEGER;
ALTER TABLE srs_state ADD COLUMN created_at TEXT;
ALTER TABLE srs_state ADD COLUMN created_at_ts INTEGER;

ALTER TABLE reviews_log ADD COLUMN scheduled_at_ts INTEGER;
ALTER TABLE reviews_log ADD COLUMN reviewed_at_ts INTEGER;

ALTER TABLE lesson_progress ADD COLUMN profile_id TEXT;
ALTER TABLE lesson_progress ADD COLUMN created_at TEXT;
ALTER TABLE lesson_progress ADD COLUMN created_at_ts INTEGER;

UPDATE srs_state
SET next_review_at_ts = CAST(strftime('%s', next_review_at) AS INTEGER) * 1000
WHERE next_review_at_ts IS NULL AND next_review_at IS NOT NULL;

UPDATE srs_state
SET last_review_at_ts = CAST(strftime('%s', last_review_at) AS INTEGER) * 1000
WHERE last_review_at_ts IS NULL AND last_review_at IS NOT NULL;

UPDATE srs_state
SET created_at = COALESCE(created_at, next_review_at),
    created_at_ts = COALESCE(created_at_ts, next_review_at_ts)
WHERE created_at IS NULL OR created_at_ts IS NULL;

UPDATE reviews_log
SET scheduled_at_ts = CAST(strftime('%s', scheduled_at) AS INTEGER) * 1000
WHERE scheduled_at_ts IS NULL AND scheduled_at IS NOT NULL;

UPDATE reviews_log
SET reviewed_at_ts = CAST(strftime('%s', reviewed_at) AS INTEGER) * 1000
WHERE reviewed_at_ts IS NULL AND reviewed_at IS NOT NULL;

UPDATE lesson_progress
SET created_at = COALESCE(created_at, last_activity_at, completed_at),
    created_at_ts = COALESCE(
      created_at_ts,
      CAST(strftime('%s', COALESCE(last_activity_at, completed_at)) AS INTEGER) * 1000
    )
WHERE created_at IS NULL OR created_at_ts IS NULL;

DROP INDEX IF EXISTS idx_srs_next_review;
DROP INDEX IF EXISTS idx_reviews_word_time;
CREATE INDEX IF NOT EXISTS idx_srs_next_review ON srs_state (next_review_at_ts);
CREATE INDEX IF NOT EXISTS idx_reviews_word_time ON reviews_log (word_id, reviewed_at_ts);
CREATE INDEX IF NOT EXISTS idx_lessons_week_order ON lessons (week, order_index);
CREATE INDEX IF NOT EXISTS idx_words_week_topic ON words (week, topic);
    `.trim(),
  },
];

export const LATEST_SCHEMA_VERSION = SCHEMA_VERSION;
