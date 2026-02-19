import { getDb, initDb } from '../db';
import { loadBundledContentIfNeeded } from '../content';
import {
  computeNextBox,
  computeNextReviewAt,
  DEFAULT_SRS_CONFIG,
  Rating,
  SrsConfig,
} from '../srs';

export type Word = {
  id: string;
  week: number;
  topic: string;
  lemma: string;
  article: string | null;
  translation: string;
  example_nl: string | null;
  example_en: string | null;
  audio_uri: string | null;
  tags: string | null;
  is_active: number;
  updated_at: string;
};

export type SrsState = {
  word_id: string;
  box: number;
  next_review_at: string;
  next_review_at_ts: number;
  last_review_at: string | null;
  last_review_at_ts: number | null;
  correct_streak: number;
  total_reviews: number;
  total_lapses: number;
  created_at: string;
  created_at_ts: number;
};

export type QueueItem = {
  word: Word;
  state: SrsState;
};

export type ReviewInput = {
  wordId: string;
  rating: Rating;
  scheduledAt: string;
  reviewedAt: string;
  latencyMs?: number;
};

function utcStartMs(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function computeStreakUpdate(
  lastReviewedAt: string | null,
  reviewedAt: string,
  prevStreakCurrent: number,
  prevStreakBest: number
): { streakCurrent: number; streakBest: number } {
  if (!lastReviewedAt) {
    const streakCurrent = 1;
    return { streakCurrent, streakBest: Math.max(prevStreakBest, streakCurrent) };
  }

  const diffDays = Math.floor((utcStartMs(reviewedAt) - utcStartMs(lastReviewedAt)) / 86400000);

  if (diffDays <= 0) {
    return { streakCurrent: prevStreakCurrent, streakBest: prevStreakBest };
  }

  const streakCurrent = diffDays === 1 ? prevStreakCurrent + 1 : 1;
  return { streakCurrent, streakBest: Math.max(prevStreakBest, streakCurrent) };
}

export async function initLocalServices(): Promise<void> {
  await initDb();
  await loadBundledContentIfNeeded();
}

export async function getWordById(id: string): Promise<Word | null> {
  const db = await getDb();
  return await db.getFirstAsync<Word>('SELECT * FROM words WHERE id = ?;', [id]);
}

export async function seedSrsState(wordId: string, nowIso: string): Promise<void> {
  const db = await getDb();
  const nowTs = Date.parse(nowIso);
  await db.runAsync(
    `INSERT INTO srs_state (
        word_id,
        box,
        next_review_at,
        next_review_at_ts,
        last_review_at,
        last_review_at_ts,
        correct_streak,
        total_reviews,
        total_lapses,
        created_at,
        created_at_ts
     )
     VALUES (?, 1, ?, ?, NULL, NULL, 0, 0, 0, ?, ?)
     ON CONFLICT(word_id) DO NOTHING;`,
    [wordId, nowIso, nowTs, nowIso, nowTs]
  );
}

export async function getTodayQueue(limit: number, nowIso: string): Promise<QueueItem[]> {
  const db = await getDb();
  const nowTs = Date.parse(nowIso);
  const rows = await db.getAllAsync<{
    word_id: string;
    box: number;
    next_review_at: string;
    next_review_at_ts: number;
    last_review_at: string | null;
    last_review_at_ts: number | null;
    correct_streak: number;
    total_reviews: number;
    total_lapses: number;
    created_at: string;
    created_at_ts: number;
    id: string;
    week: number;
    topic: string;
    lemma: string;
    article: string | null;
    translation: string;
    example_nl: string | null;
    example_en: string | null;
    audio_uri: string | null;
    tags: string | null;
    is_active: number;
    updated_at: string;
  }>(
    `SELECT s.word_id, s.box, s.next_review_at, s.last_review_at, s.correct_streak, s.total_reviews, s.total_lapses,
            s.next_review_at_ts, s.last_review_at_ts, s.created_at, s.created_at_ts,
            w.id, w.week, w.topic, w.lemma, w.article, w.translation, w.example_nl, w.example_en, w.audio_uri, w.tags, w.is_active, w.updated_at
     FROM srs_state s
     JOIN words w ON w.id = s.word_id
     WHERE s.next_review_at_ts <= ? AND w.is_active = 1
     ORDER BY s.next_review_at_ts ASC
     LIMIT ?;`,
    [nowTs, limit]
  );

  return rows.map((r) => ({
    word: {
      id: r.id,
      week: r.week,
      topic: r.topic,
      lemma: r.lemma,
      article: r.article,
      translation: r.translation,
      example_nl: r.example_nl,
      example_en: r.example_en,
      audio_uri: r.audio_uri,
      tags: r.tags,
      is_active: r.is_active,
      updated_at: r.updated_at,
    },
    state: {
      word_id: r.word_id,
      box: r.box,
      next_review_at: r.next_review_at,
      next_review_at_ts: r.next_review_at_ts,
      last_review_at: r.last_review_at,
      last_review_at_ts: r.last_review_at_ts,
      correct_streak: r.correct_streak,
      total_reviews: r.total_reviews,
      total_lapses: r.total_lapses,
      created_at: r.created_at,
      created_at_ts: r.created_at_ts,
    },
  }));
}

export async function reviewWord(
  input: ReviewInput,
  config: SrsConfig = DEFAULT_SRS_CONFIG
): Promise<void> {
  const db = await getDb();
  const reviewedAtTs = Date.parse(input.reviewedAt);
  const scheduledAtTs = Date.parse(input.scheduledAt);
  const prev = await db.getFirstAsync<SrsState>(
    'SELECT * FROM srs_state WHERE word_id = ?;',
    [input.wordId]
  );

  const prevBox = prev?.box ?? 1;
  const nextBox = computeNextBox(prevBox, input.rating);
  const nextReviewAt = computeNextReviewAt(input.reviewedAt, nextBox, config);
  const nextReviewAtTs = Date.parse(nextReviewAt);
  const createdAt = prev?.created_at ?? input.reviewedAt;
  const createdAtTs = prev?.created_at_ts ?? reviewedAtTs;

  const totalReviews = (prev?.total_reviews ?? 0) + 1;
  const totalLapses = (prev?.total_lapses ?? 0) + (input.rating === 'again' ? 1 : 0);
  const correctStreak = input.rating === 'again' ? 0 : (prev?.correct_streak ?? 0) + 1;

  await db.execAsync('BEGIN;');
  try {
    const appState = await db.getFirstAsync<{
      streak_current: number;
      streak_best: number;
      last_reviewed_at: string | null;
    }>('SELECT streak_current, streak_best, last_reviewed_at FROM app_state WHERE id = 1;');

    const streakUpdate = computeStreakUpdate(
      appState?.last_reviewed_at ?? null,
      input.reviewedAt,
      appState?.streak_current ?? 0,
      appState?.streak_best ?? 0
    );

    await db.runAsync(
      `INSERT INTO reviews_log (
         word_id,
         rating,
         prev_box,
         next_box,
         scheduled_at,
         scheduled_at_ts,
         reviewed_at,
         reviewed_at_ts,
         latency_ms
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        input.wordId,
        input.rating,
        prevBox,
        nextBox,
        input.scheduledAt,
        scheduledAtTs,
        input.reviewedAt,
        reviewedAtTs,
        input.latencyMs ?? null,
      ]
    );

    await db.runAsync(
      `INSERT INTO srs_state (
         word_id,
         box,
         next_review_at,
         next_review_at_ts,
         last_review_at,
         last_review_at_ts,
         correct_streak,
         total_reviews,
         total_lapses,
         created_at,
         created_at_ts
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(word_id) DO UPDATE SET
         box = excluded.box,
         next_review_at = excluded.next_review_at,
         next_review_at_ts = excluded.next_review_at_ts,
         last_review_at = excluded.last_review_at,
         last_review_at_ts = excluded.last_review_at_ts,
         correct_streak = excluded.correct_streak,
         total_reviews = excluded.total_reviews,
         total_lapses = excluded.total_lapses,
         created_at = srs_state.created_at,
         created_at_ts = srs_state.created_at_ts;`,
      [
        input.wordId,
        nextBox,
        nextReviewAt,
        nextReviewAtTs,
        input.reviewedAt,
        reviewedAtTs,
        correctStreak,
        totalReviews,
        totalLapses,
        createdAt,
        createdAtTs,
      ]
    );

    await db.runAsync(
      `UPDATE app_state
       SET last_reviewed_at = ?, streak_current = ?, streak_best = ?
       WHERE id = 1;`,
      [input.reviewedAt, streakUpdate.streakCurrent, streakUpdate.streakBest]
    );

    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}
