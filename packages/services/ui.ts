import { getDb } from '../db';
import {
  DEFAULT_SRS_CONFIG,
  Rating,
  computeNextBox,
  computeNextReviewAt,
} from '../srs';
import { getTodayQueue, reviewWord, seedSrsState } from './local';
import type {
  DialogueDTO,
  DialogueLineDTO,
  DialogueSummaryDTO,
  ExerciseDTO,
  LessonDTO,
  LessonPayloadDTO,
  LessonProgressDTO,
  LessonSummaryDTO,
  ProgressDTO,
  ReviewResultDTO,
  SettingsDTO,
  SentenceLessonPayloadDTO,
  SentenceLineDTO,
  SrsStateDTO,
  TodayQueueItemDTO,
  VocabLessonPayloadDTO,
  WordDTO,
} from './dtos';

type WordRow = {
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

type SrsStateRow = {
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

type LessonRow = {
  id: string;
  week: number;
  title: string;
  kind: string;
  order_index: number;
  payload: string;
  updated_at: string;
};

type DialogueRow = {
  id: string;
  week: number;
  scenario: string;
  title: string;
  lines: string;
  updated_at: string;
};

type ExerciseRow = {
  id: string;
  week: number;
  kind: string;
  prompt: string;
  data: string;
  updated_at: string;
};

type LessonProgressRow = {
  lesson_id: string;
  status: LessonProgressDTO['status'];
  last_activity_at: string | null;
  completed_at: string | null;
};

type SettingsRow = {
  daily_goal: number;
  notifications_enabled: number;
};

type AppStateRow = {
  streak_current: number;
  streak_best: number;
  last_active_at: string | null;
  last_reviewed_at: string | null;
  content_version: string;
};

const DEFAULT_DAILY_GOAL = 30;

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapWord(row: WordRow): WordDTO {
  return {
    id: row.id,
    week: row.week,
    topic: row.topic,
    lemma: row.lemma,
    article: row.article as WordDTO['article'],
    translation: row.translation,
    exampleNl: row.example_nl,
    exampleEn: row.example_en,
    audioUri: row.audio_uri,
    tags: safeJsonParse<string[]>(row.tags, []),
    isActive: row.is_active === 1,
    updatedAt: row.updated_at,
  };
}

function mapSrsState(row: SrsStateRow): SrsStateDTO {
  return {
    wordId: row.word_id,
    box: row.box,
    nextReviewAt: row.next_review_at,
    nextReviewAtTs: row.next_review_at_ts,
    lastReviewAt: row.last_review_at,
    lastReviewAtTs: row.last_review_at_ts,
    correctStreak: row.correct_streak,
    totalReviews: row.total_reviews,
    totalLapses: row.total_lapses,
    createdAt: row.created_at,
    createdAtTs: row.created_at_ts,
  };
}

function mapLessonProgress(row: LessonProgressRow | null): LessonProgressDTO | null {
  if (!row) return null;
  return {
    lessonId: row.lesson_id,
    status: row.status,
    lastActivityAt: row.last_activity_at,
    completedAt: row.completed_at,
  };
}

function parseSentenceLine(raw: unknown): SentenceLineDTO | null {
  if (!raw || typeof raw !== 'object') return null;
  const line = raw as Record<string, unknown>;
  if (typeof line.nl !== 'string' || typeof line.en !== 'string') return null;
  return { nl: line.nl, en: line.en };
}

function parseLessonPayload(raw: string): LessonPayloadDTO {
  const payload = safeJsonParse<Record<string, unknown>>(raw, {});
  const wordIds = Array.isArray(payload.word_ids) ? (payload.word_ids as string[]) : [];
  const introNl = typeof payload.intro_nl === 'string' ? payload.intro_nl : undefined;
  const introEn = typeof payload.intro_en === 'string' ? payload.intro_en : undefined;
  const patternTitleEn =
    typeof payload.pattern_title_en === 'string' ? payload.pattern_title_en : undefined;
  const patternDescEn =
    typeof payload.pattern_desc_en === 'string' ? payload.pattern_desc_en : undefined;

  if (
    typeof payload.pattern_code === 'string' &&
    typeof payload.pattern_title === 'string' &&
    typeof payload.pattern_desc === 'string' &&
    payload.example &&
    Array.isArray(payload.sentences)
  ) {
    const example = parseSentenceLine(payload.example);
    const sentences = payload.sentences
      .map(parseSentenceLine)
      .filter((s): s is SentenceLineDTO => Boolean(s));
    if (example && sentences.length > 0) {
      const sentencePayload: SentenceLessonPayloadDTO = {
        patternCode: payload.pattern_code as SentenceLessonPayloadDTO['patternCode'],
        patternTitle: payload.pattern_title,
        patternDesc: payload.pattern_desc,
        patternTitleEn,
        patternDescEn,
        example,
        sentences,
        wordIds: wordIds.length > 0 ? wordIds : undefined,
      };
      return sentencePayload;
    }
  }

  const vocabPayload: VocabLessonPayloadDTO = { wordIds, introNl, introEn };
  return vocabPayload;
}

function parseDialogueLines(raw: string): DialogueLineDTO[] {
  const lines = safeJsonParse<DialogueLineDTO[]>(raw, []);
  return Array.isArray(lines) ? lines : [];
}

function utcStartMs(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function localStartMs(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

async function getSettingsRow(): Promise<SettingsRow> {
  const db = await getDb();
  const row = await db.getFirstAsync<SettingsRow>(
    'SELECT daily_goal, notifications_enabled FROM user_settings WHERE id = 1;'
  );
  return row ?? { daily_goal: DEFAULT_DAILY_GOAL, notifications_enabled: 0 };
}

export async function getSettings(): Promise<SettingsDTO> {
  const row = await getSettingsRow();
  return {
    dailyGoal: row.daily_goal,
    notificationsEnabled: row.notifications_enabled === 1,
  };
}

export async function updateSettings(patch: Partial<SettingsDTO>): Promise<SettingsDTO> {
  const db = await getDb();
  const existing = await getSettingsRow();
  const dailyGoal = patch.dailyGoal ?? existing.daily_goal;
  const notificationsEnabled =
    patch.notificationsEnabled ?? (existing.notifications_enabled === 1);
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE user_settings
     SET daily_goal = ?, notifications_enabled = ?, updated_at = ?
     WHERE id = 1;`,
    [dailyGoal, notificationsEnabled ? 1 : 0, now]
  );

  return {
    dailyGoal,
    notificationsEnabled,
  };
}

export async function getProgress(
  nowIso: string = new Date().toISOString(),
  settings?: SettingsDTO
): Promise<ProgressDTO> {
  const db = await getDb();
  const nowTs = Date.parse(nowIso);
  const startOfDayTs = localStartMs(nowIso);

  const dueRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM srs_state WHERE next_review_at_ts <= ?;',
    [nowTs]
  );
  const reviewsTodayRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reviews_log WHERE reviewed_at_ts >= ?;',
    [startOfDayTs]
  );
  const totalReviewsRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reviews_log;'
  );
  const appState = await db.getFirstAsync<AppStateRow>(
    'SELECT streak_current, streak_best, last_active_at, last_reviewed_at, content_version FROM app_state WHERE id = 1;'
  );

  const settingsRow = settings ?? (await getSettings());

  return {
    dailyGoal: settingsRow.dailyGoal,
    dueCount: Number(dueRow?.count ?? 0),
    reviewsTodayCount: Number(reviewsTodayRow?.count ?? 0),
    totalReviews: Number(totalReviewsRow?.count ?? 0),
    streakCurrent: appState?.streak_current ?? 0,
    streakBest: appState?.streak_best ?? 0,
    lastActiveAt: appState?.last_active_at ?? null,
    lastReviewedAt: appState?.last_reviewed_at ?? null,
    contentVersion: appState?.content_version ?? 'v0.0.0',
  };
}

export async function getThemeProgress(
  week: number,
  nowIso: string = new Date().toISOString()
): Promise<{ totalWords: number; reviewedTodayCount: number; dueCount: number }> {
  const db = await getDb();
  const nowTs = Date.parse(nowIso);
  const startOfDayTs = utcStartMs(nowIso);

  const totalWordsRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM words WHERE week = ? AND is_active = 1;',
    [week]
  );
  const dueRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM srs_state s
     JOIN words w ON w.id = s.word_id
     WHERE w.week = ? AND w.is_active = 1 AND s.next_review_at_ts <= ?;`,
    [week, nowTs]
  );
  const reviewedTodayRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM reviews_log r
     JOIN words w ON w.id = r.word_id
     WHERE w.week = ? AND w.is_active = 1 AND r.reviewed_at_ts >= ?;`,
    [week, startOfDayTs]
  );

  return {
    totalWords: Number(totalWordsRow?.count ?? 0),
    reviewedTodayCount: Number(reviewedTodayRow?.count ?? 0),
    dueCount: Number(dueRow?.count ?? 0),
  };
}

export async function getTodayPlan(
  limit?: number
): Promise<{ queue: TodayQueueItemDTO[]; progress: ProgressDTO }> {
  const nowIso = new Date().toISOString();
  const settings = await getSettings();
  const effectiveLimit = limit ?? settings.dailyGoal;
  const queueRows = await getTodayQueue(effectiveLimit, nowIso);
  const queue = queueRows.map((item) => ({
    word: mapWord(item.word),
    state: mapSrsState(item.state),
  }));
  const progress = await getProgress(nowIso, settings);
  return { queue, progress };
}

export async function getReviewQueue(limit?: number): Promise<TodayQueueItemDTO[]> {
  const nowIso = new Date().toISOString();
  const settings = await getSettings();
  const effectiveLimit = limit ?? settings.dailyGoal;
  const queueRows = await getTodayQueue(effectiveLimit, nowIso);
  return queueRows.map((item) => ({
    word: mapWord(item.word),
    state: mapSrsState(item.state),
  }));
}

export async function getReviewQueueByWeek(week: number): Promise<TodayQueueItemDTO[]> {
  const db = await getDb();
  const nowIso = new Date().toISOString();
  const words = await db.getAllAsync<WordRow>(
    `SELECT * FROM words WHERE week = ? AND is_active = 1 ORDER BY id ASC;`,
    [week]
  );
  const ids = words.map((w) => w.id);
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  let states = await db.getAllAsync<SrsStateRow>(
    `SELECT * FROM srs_state WHERE word_id IN (${placeholders});`,
    ids
  );

  const haveState = new Set(states.map((s) => s.word_id));
  const missing = ids.filter((id) => !haveState.has(id));
  for (const id of missing) {
    await seedSrsState(id, nowIso);
  }

  if (missing.length > 0) {
    states = await db.getAllAsync<SrsStateRow>(
      `SELECT * FROM srs_state WHERE word_id IN (${placeholders});`,
      ids
    );
  }

  const stateById = new Map(states.map((s) => [s.word_id, s]));
  return words
    .map((word) => {
      const state = stateById.get(word.id);
      if (!state) return null;
      return {
        word: mapWord(word),
        state: mapSrsState(state),
      };
    })
    .filter((item): item is TodayQueueItemDTO => Boolean(item));
}

export async function recordReview(
  wordId: string,
  rating: Rating,
  scheduledAtIso?: string
): Promise<ReviewResultDTO> {
  const db = await getDb();
  const reviewedAt = new Date().toISOString();
  let prevState = await db.getFirstAsync<SrsStateRow>(
    'SELECT * FROM srs_state WHERE word_id = ?;',
    [wordId]
  );

  if (!prevState) {
    await seedSrsState(wordId, reviewedAt);
    prevState = await db.getFirstAsync<SrsStateRow>(
      'SELECT * FROM srs_state WHERE word_id = ?;',
      [wordId]
    );
  }

  const prevBox = prevState?.box ?? 1;
  const nextBox = computeNextBox(prevBox, rating);
  const nextReviewAt = computeNextReviewAt(reviewedAt, nextBox, DEFAULT_SRS_CONFIG);
  const scheduledAt = scheduledAtIso ?? prevState?.next_review_at ?? reviewedAt;

  await reviewWord({
    wordId,
    rating,
    scheduledAt,
    reviewedAt,
  });

  const updatedState = await db.getFirstAsync<SrsStateRow>(
    'SELECT * FROM srs_state WHERE word_id = ?;',
    [wordId]
  );

  if (!updatedState) {
    throw new Error(`SRS state missing after review for word ${wordId}`);
  }

  const progress = await getProgress(reviewedAt);

  return {
    wordId,
    rating,
    prevBox,
    nextBox,
    scheduledAt,
    reviewedAt,
    nextReviewAt,
    state: mapSrsState(updatedState),
    progress,
  };
}

async function getWordsByIds(ids: string[]): Promise<WordDTO[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  const rows = await db.getAllAsync<WordRow>(
    `SELECT * FROM words WHERE id IN (${placeholders});`,
    ids
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is WordRow => Boolean(row))
    .map(mapWord);
}

async function getLessonProgressRow(lessonId: string): Promise<LessonProgressRow | null> {
  const db = await getDb();
  return await db.getFirstAsync<LessonProgressRow>(
    'SELECT lesson_id, status, last_activity_at, completed_at FROM lesson_progress WHERE lesson_id = ?;',
    [lessonId]
  );
}

export async function setLessonProgress(
  lessonId: string,
  status: LessonProgressDTO['status']
): Promise<LessonProgressDTO> {
  const db = await getDb();
  const now = new Date().toISOString();
  const nowTs = Date.parse(now);
  const completedAt = status === 'done' ? now : null;

  await db.runAsync(
    `INSERT INTO lesson_progress (
       lesson_id, profile_id, status, last_activity_at, completed_at, created_at, created_at_ts
     )
     VALUES (?, NULL, ?, ?, ?, ?, ?)
     ON CONFLICT(lesson_id) DO UPDATE SET
       status = excluded.status,
       last_activity_at = excluded.last_activity_at,
       completed_at = excluded.completed_at;`,
    [lessonId, status, now, completedAt, now, nowTs]
  );

  const updated = await getLessonProgressRow(lessonId);
  if (!updated) {
    throw new Error(`Lesson progress missing after update for ${lessonId}`);
  }
  return mapLessonProgress(updated) as LessonProgressDTO;
}

export async function getLesson(lessonId: string): Promise<LessonDTO | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LessonRow>(
    'SELECT * FROM lessons WHERE id = ?;',
    [lessonId]
  );
  if (!row) return null;
  const payload = parseLessonPayload(row.payload);
  const wordIds = Array.isArray((payload as { wordIds?: string[] }).wordIds)
    ? ((payload as { wordIds?: string[] }).wordIds as string[])
    : [];
  const words = await getWordsByIds(wordIds);
  const progress = mapLessonProgress(await getLessonProgressRow(lessonId));
  return {
    id: row.id,
    week: row.week,
    title: row.title,
    kind: row.kind,
    orderIndex: row.order_index,
    payload,
    words,
    updatedAt: row.updated_at,
    progress,
  };
}

export async function listLessonsByWeek(week: number): Promise<LessonSummaryDTO[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<LessonRow & { progress_status: LessonProgressDTO['status'] | null }>(
    `SELECT l.*, p.status as progress_status
     FROM lessons l
     LEFT JOIN lesson_progress p ON p.lesson_id = l.id
     WHERE l.week = ?
     ORDER BY l.order_index ASC;`,
    [week]
  );
  return rows.map((row) => ({
    id: row.id,
    week: row.week,
    title: row.title,
    kind: row.kind,
    orderIndex: row.order_index,
    updatedAt: row.updated_at,
    progressStatus: row.progress_status ?? null,
  }));
}

export async function getDialogue(dialogueId: string): Promise<DialogueDTO | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DialogueRow>(
    'SELECT * FROM dialogues WHERE id = ?;',
    [dialogueId]
  );
  if (!row) return null;
  return {
    id: row.id,
    week: row.week,
    scenario: row.scenario,
    title: row.title,
    lines: parseDialogueLines(row.lines),
    updatedAt: row.updated_at,
  };
}

export async function listDialoguesByWeek(week: number): Promise<DialogueSummaryDTO[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DialogueRow>(
    `SELECT * FROM dialogues WHERE week = ? ORDER BY id ASC;`,
    [week]
  );
  return rows.map((row) => ({
    id: row.id,
    week: row.week,
    scenario: row.scenario,
    title: row.title,
    updatedAt: row.updated_at,
  }));
}

export async function listExercisesByWeek(week: number): Promise<ExerciseDTO[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT * FROM exercises WHERE week = ? ORDER BY id ASC;`,
    [week]
  );
  return rows.map((row) => ({
    id: row.id,
    week: row.week,
    kind: row.kind,
    prompt: row.prompt,
    data: safeJsonParse<Record<string, unknown>>(row.data, {}),
    updatedAt: row.updated_at,
  }));
}

export async function listWeeks(): Promise<number[]> {
  const db = await getDb();
  const lessonWeeks = await db.getAllAsync<{ week: number }>(
    'SELECT DISTINCT week FROM lessons ORDER BY week ASC;'
  );
  if (lessonWeeks.length > 0) {
    return lessonWeeks.map((row) => Number(row.week));
  }
  const wordWeeks = await db.getAllAsync<{ week: number }>(
    'SELECT DISTINCT week FROM words ORDER BY week ASC;'
  );
  return wordWeeks.map((row) => Number(row.week));
}
