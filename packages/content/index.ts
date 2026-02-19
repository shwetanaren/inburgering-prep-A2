import * as Crypto from 'expo-crypto';
import { getDb } from '../db';

import words from '../../content/v1.0.0/words.json';
import lessons from '../../content/v1.0.0/lessons.json';
import dialogues from '../../content/v1.0.0/dialogues.json';
import exercises from '../../content/v1.0.0/exercises.json';

export const BUNDLED_CONTENT_VERSION = 'v1.0.0';

export type Word = {
  id: string;
  week: number;
  topic: string;
  lemma: string;
  article: string | null;
  translation: string;
  example_nl?: string | null;
  example_en?: string | null;
  audio_uri?: string | null;
  tags?: string[] | null;
  is_active: number;
  updated_at: string;
};

export type Lesson = {
  id: string;
  week: number;
  title: string;
  kind: string;
  order_index: number;
  payload: { word_ids?: string[] } & Record<string, unknown>;
  updated_at: string;
};

export type Dialogue = {
  id: string;
  week: number;
  scenario: string;
  title: string;
  lines: Array<{ speaker: string; nl: string; en: string }>;
  updated_at: string;
};

export type Exercise = {
  id: string;
  week: number;
  kind: string;
  prompt: string;
  data: Record<string, unknown>;
  updated_at: string;
};

export type ContentPack = {
  version: string;
  words: Word[];
  lessons: Lesson[];
  dialogues: Dialogue[];
  exercises: Exercise[];
};

export type DbLike = {
  runAsync(sql: string, params?: unknown[]): Promise<unknown>;
  execAsync(sql: string): Promise<unknown>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
};

export const bundledPack: ContentPack = {
  version: BUNDLED_CONTENT_VERSION,
  words: words as Word[],
  lessons: lessons as Lesson[],
  dialogues: dialogues as Dialogue[],
  exercises: exercises as Exercise[],
};

function isIsoUtc(value: string): boolean {
  return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/.test(value);
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function validateContentPack(pack: ContentPack): void {
  assert(pack.version.length > 0, 'content version is required');
  assert(Array.isArray(pack.words), 'words must be an array');
  assert(Array.isArray(pack.lessons), 'lessons must be an array');
  assert(Array.isArray(pack.dialogues), 'dialogues must be an array');
  assert(Array.isArray(pack.exercises), 'exercises must be an array');

  const wordIds = new Set<string>();
  for (const w of pack.words) {
    assert(typeof w.id === 'string' && w.id.length > 0, 'word.id is required');
    assert(w.id.startsWith('w_'), `word\\.id must start with w_: ${w.id}`);
    assert(!wordIds.has(w.id), `duplicate word.id: ${w.id}`);
    wordIds.add(w.id);
    assert(Number.isInteger(w.week) && w.week > 0, `word.week invalid: ${w.id}`);
    assert(typeof w.topic === 'string', `word.topic invalid: ${w.id}`);
    assert(typeof w.lemma === 'string', `word.lemma invalid: ${w.id}`);
    assert(typeof w.translation === 'string', `word.translation invalid: ${w.id}`);
    assert(typeof w.updated_at === 'string' && isIsoUtc(w.updated_at), `word.updated_at invalid: ${w.id}`);
    assert(w.is_active === 0 || w.is_active === 1, `word.is_active invalid: ${w.id}`);
    if (w.tags) assert(Array.isArray(w.tags), `word.tags invalid: ${w.id}`);
  }

  const lessonIds = new Set<string>();
  for (const l of pack.lessons) {
    assert(typeof l.id === 'string' && l.id.length > 0, 'lesson.id is required');
    assert(l.id.startsWith('l_'), `lesson.id must start with l_: ${l.id}`);
    assert(!lessonIds.has(l.id), `duplicate lesson.id: ${l.id}`);
    lessonIds.add(l.id);
    assert(Number.isInteger(l.week) && l.week > 0, `lesson.week invalid: ${l.id}`);
    assert(typeof l.title === 'string', `lesson.title invalid: ${l.id}`);
    assert(typeof l.kind === 'string', `lesson.kind invalid: ${l.id}`);
    assert(Number.isInteger(l.order_index), `lesson.order_index invalid: ${l.id}`);
    assert(typeof l.updated_at === 'string' && isIsoUtc(l.updated_at), `lesson.updated_at invalid: ${l.id}`);
    if (l.payload?.word_ids) {
      assert(Array.isArray(l.payload.word_ids), `lesson.payload.word_ids invalid: ${l.id}`);
      for (const wid of l.payload.word_ids) {
        assert(wordIds.has(wid), `lesson.payload.word_ids missing word: ${wid}`);
      }
    }
  }

  for (const d of pack.dialogues) {
    assert(typeof d.id === 'string' && d.id.length > 0, 'dialogue.id is required');
    assert(d.id.startsWith('d_'), `dialogue.id must start with d_: ${d.id}`);
    assert(Number.isInteger(d.week) && d.week > 0, `dialogue.week invalid: ${d.id}`);
    assert(typeof d.scenario === 'string', `dialogue.scenario invalid: ${d.id}`);
    assert(typeof d.title === 'string', `dialogue.title invalid: ${d.id}`);
    assert(Array.isArray(d.lines), `dialogue.lines invalid: ${d.id}`);
    for (const line of d.lines) {
      assert(typeof line.speaker === 'string', `dialogue.line.speaker invalid: ${d.id}`);
      assert(typeof line.nl === 'string', `dialogue.line.nl invalid: ${d.id}`);
      assert(typeof line.en === 'string', `dialogue.line.en invalid: ${d.id}`);
    }
    assert(typeof d.updated_at === 'string' && isIsoUtc(d.updated_at), `dialogue.updated_at invalid: ${d.id}`);
  }

  for (const e of pack.exercises) {
    assert(typeof e.id === 'string' && e.id.length > 0, 'exercise.id is required');
    assert(e.id.startsWith('e_'), `exercise.id must start with e_: ${e.id}`);
    assert(Number.isInteger(e.week) && e.week > 0, `exercise.week invalid: ${e.id}`);
    assert(typeof e.kind === 'string', `exercise.kind invalid: ${e.id}`);
    assert(typeof e.prompt === 'string', `exercise.prompt invalid: ${e.id}`);
    assert(typeof e.data === 'object', `exercise.data invalid: ${e.id}`);
    assert(typeof e.updated_at === 'string' && isIsoUtc(e.updated_at), `exercise.updated_at invalid: ${e.id}`);
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

export async function computeBuildHash(pack: ContentPack): Promise<string> {
  const raw = stableJson(pack);
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
}

async function importWords(db: DbLike, list: Word[]): Promise<void> {
  const now = new Date().toISOString();
  const nowTs = Date.parse(now);

  await db.execAsync('BEGIN;');
  try {
    await db.runAsync('UPDATE words SET is_active = 0;');

    for (const w of list) {
      await db.runAsync(
        `INSERT INTO words (
           id, week, topic, lemma, article, translation, example_nl, example_en,
           audio_uri, tags, is_active, updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           week = excluded.week,
           topic = excluded.topic,
           lemma = excluded.lemma,
           article = excluded.article,
           translation = excluded.translation,
           example_nl = excluded.example_nl,
           example_en = excluded.example_en,
           audio_uri = excluded.audio_uri,
           tags = excluded.tags,
           is_active = excluded.is_active,
           updated_at = excluded.updated_at;`,
        [
          w.id,
          w.week,
          w.topic,
          w.lemma,
          w.article ?? null,
          w.translation,
          w.example_nl ?? null,
          w.example_en ?? null,
          w.audio_uri ?? null,
          w.tags ? JSON.stringify(w.tags) : null,
          w.is_active ?? 1,
          w.updated_at,
        ]
      );
    }

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
       SELECT w.id, 1, ?, ?, NULL, NULL, 0, 0, 0, ?, ?
       FROM words w
       LEFT JOIN srs_state s ON s.word_id = w.id
       WHERE s.word_id IS NULL AND w.is_active = 1;`,
      [now, nowTs, now, nowTs]
    );

    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}

async function importLessons(db: DbLike, list: Lesson[]): Promise<void> {
  await db.execAsync('BEGIN;');
  try {
    for (const l of list) {
      await db.runAsync(
        `INSERT INTO lessons (id, week, title, kind, order_index, payload, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           week = excluded.week,
           title = excluded.title,
           kind = excluded.kind,
           order_index = excluded.order_index,
           payload = excluded.payload,
           updated_at = excluded.updated_at;`,
        [
          l.id,
          l.week,
          l.title,
          l.kind,
          l.order_index,
          JSON.stringify(l.payload ?? {}),
          l.updated_at,
        ]
      );
    }
    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}

async function importDialogues(db: DbLike, list: Dialogue[]): Promise<void> {
  await db.execAsync('BEGIN;');
  try {
    for (const d of list) {
      await db.runAsync(
        `INSERT INTO dialogues (id, week, scenario, title, lines, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           week = excluded.week,
           scenario = excluded.scenario,
           title = excluded.title,
           lines = excluded.lines,
           updated_at = excluded.updated_at;`,
        [
          d.id,
          d.week,
          d.scenario,
          d.title,
          JSON.stringify(d.lines ?? []),
          d.updated_at,
        ]
      );
    }
    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}

async function importExercises(db: DbLike, list: Exercise[]): Promise<void> {
  await db.execAsync('BEGIN;');
  try {
    for (const e of list) {
      await db.runAsync(
        `INSERT INTO exercises (id, week, kind, prompt, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           week = excluded.week,
           kind = excluded.kind,
           prompt = excluded.prompt,
           data = excluded.data,
           updated_at = excluded.updated_at;`,
        [
          e.id,
          e.week,
          e.kind,
          e.prompt,
          JSON.stringify(e.data ?? {}),
          e.updated_at,
        ]
      );
    }
    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}

export async function importContentPack(db: DbLike, pack: ContentPack): Promise<void> {
  validateContentPack(pack);
  await importWords(db, pack.words);
  await importLessons(db, pack.lessons);
  await importDialogues(db, pack.dialogues);
  await importExercises(db, pack.exercises);
}

export async function loadContentPackIfNeeded(
  db: DbLike,
  pack: ContentPack,
  buildHash: string
): Promise<void> {
  const existing = await db.getFirstAsync<{ content_version: string; build_hash: string }>(
    'SELECT content_version, build_hash FROM content_meta WHERE id = 1;'
  );

  if (existing?.content_version === pack.version && existing?.build_hash === buildHash) {
    return;
  }

  await importContentPack(db, pack);

  await db.execAsync('BEGIN;');
  try {
    await db.runAsync(
      `INSERT INTO content_meta (id, content_version, build_hash, installed_at)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         content_version = excluded.content_version,
         build_hash = excluded.build_hash,
         installed_at = excluded.installed_at;`,
      [pack.version, buildHash, new Date().toISOString()]
    );

    await db.runAsync(
      `UPDATE app_state SET content_version = ? WHERE id = 1;`,
      [pack.version]
    );

    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}

export async function loadBundledContentIfNeeded(): Promise<void> {
  const db = await getDb();
  const buildHash = await computeBuildHash(bundledPack);
  await loadContentPackIfNeeded(db, bundledPack, buildHash);
}
