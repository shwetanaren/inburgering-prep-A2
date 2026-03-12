import wordsRaw from '../../content/v1.0.0/words.json';
import lessonsRaw from '../../content/v1.0.0/lessons.json';
import dialoguesRaw from '../../content/v1.0.0/dialogues.json';
import exercisesRaw from '../../content/v1.0.0/exercises.json';
import {
  DEFAULT_SRS_CONFIG,
  Rating,
  computeNextBox,
  computeNextReviewAt,
} from '../srs';
import type {
  ActivitySummaryDTO,
  ContentKind,
  ContentProgressDTO,
  ContentReviewResultDTO,
  DialogueDTO,
  DialogueSummaryDTO,
  ExerciseDTO,
  LessonDTO,
  LessonPayloadDTO,
  LessonProgressDTO,
  LessonSummaryDTO,
  ProgressDTO,
  ReviewResultDTO,
  SentenceLessonPayloadDTO,
  SentenceLineDTO,
  SettingsDTO,
  SrsStateDTO,
  TodayQueueItemDTO,
  VocabLessonPayloadDTO,
  WeeklyActivityDTO,
  WordDTO,
} from './dtos';

type RawWord = {
  id: string;
  week: number;
  topic: string;
  lemma: string;
  article: 'de' | 'het' | null;
  translation: string;
  example_nl: string | null;
  example_en: string | null;
  audio_uri: string | null;
  tags: string[] | null;
  is_active: number;
  updated_at: string;
};

type RawLesson = {
  id: string;
  week: number;
  title: string;
  kind: string;
  order_index: number;
  payload: Record<string, unknown>;
  updated_at: string;
};

type RawDialogue = {
  id: string;
  week: number;
  scenario: string;
  title: string;
  lines: Array<{ speaker: string; nl: string; en: string }>;
  updated_at: string;
};

type RawExercise = {
  id: string;
  week: number;
  kind: string;
  prompt: string;
  data: Record<string, unknown>;
  updated_at: string;
};

type WordReviewLog = {
  wordId: string;
  rating: Rating;
  reviewedAt: string;
  scheduledAt: string;
  prevBox: number;
  nextBox: number;
};

type ContentReviewLog = {
  contentId: string;
  kind: ContentKind;
  rating: Rating;
  reviewedAt: string;
  scheduledAt: string;
  prevBox: number;
  nextBox: number;
};

type PersistedState = {
  wordStates: Record<string, SrsStateDTO>;
  wordReviewLogs: WordReviewLog[];
  contentStates: Record<string, SrsStateDTO>;
  contentReviewLogs: ContentReviewLog[];
  lessonProgress: Record<string, LessonProgressDTO>;
  settings: SettingsDTO;
  streakCurrent: number;
  streakBest: number;
  lastActiveAt: string | null;
  lastReviewedAt: string | null;
  contentVersion: string;
};

const STORAGE_KEY = 'inburgeringprep-web-state-v1';
const DEFAULT_DAILY_GOAL = 30;
const CONTENT_VERSION = 'v1.0.0';

const words = wordsRaw as RawWord[];
const lessons = lessonsRaw as RawLesson[];
const dialogues = dialoguesRaw as RawDialogue[];
const exercises = exercisesRaw as RawExercise[];

let memoryState: PersistedState | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function localStartMs(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function utcStartMs(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function localWeekStartMs(iso: string): number {
  const d = new Date(iso);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

function formatWeekLabel(ms: number): string {
  const d = new Date(ms);
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `${month} ${d.getDate()}`;
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

function defaultState(): PersistedState {
  return {
    wordStates: {},
    wordReviewLogs: [],
    contentStates: {},
    contentReviewLogs: [],
    lessonProgress: {},
    settings: {
      dailyGoal: DEFAULT_DAILY_GOAL,
      notificationsEnabled: false,
    },
    streakCurrent: 0,
    streakBest: 0,
    lastActiveAt: null,
    lastReviewedAt: null,
    contentVersion: CONTENT_VERSION,
  };
}

function readState(): PersistedState {
  if (memoryState) return memoryState;
  if (!isBrowser()) {
    memoryState = defaultState();
    return memoryState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryState = defaultState();
    return memoryState;
  }

  try {
    memoryState = { ...defaultState(), ...(JSON.parse(raw) as PersistedState) };
    return memoryState;
  } catch {
    memoryState = defaultState();
    return memoryState;
  }
}

function writeState(next: PersistedState): void {
  memoryState = next;
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

function contentKey(kind: ContentKind, contentId: string): string {
  return `${kind}:${contentId}`;
}

function mapWord(word: RawWord): WordDTO {
  return {
    id: word.id,
    week: word.week,
    topic: word.topic,
    lemma: word.lemma,
    article: word.article,
    translation: word.translation,
    exampleNl: word.example_nl,
    exampleEn: word.example_en,
    audioUri: word.audio_uri,
    tags: word.tags ?? [],
    isActive: word.is_active === 1,
    updatedAt: word.updated_at,
  };
}

function parseSentenceLine(raw: unknown): SentenceLineDTO | null {
  if (!raw || typeof raw !== 'object') return null;
  const line = raw as Record<string, unknown>;
  if (typeof line.nl !== 'string' || typeof line.en !== 'string') return null;
  return { nl: line.nl, en: line.en };
}

function parseLessonPayload(raw: RawLesson['payload']): LessonPayloadDTO {
  const wordIds = Array.isArray(raw.word_ids) ? (raw.word_ids as string[]) : [];
  const introNl = typeof raw.intro_nl === 'string' ? raw.intro_nl : undefined;
  const introEn = typeof raw.intro_en === 'string' ? raw.intro_en : undefined;
  const patternTitleEn =
    typeof raw.pattern_title_en === 'string' ? raw.pattern_title_en : undefined;
  const patternDescEn =
    typeof raw.pattern_desc_en === 'string' ? raw.pattern_desc_en : undefined;

  if (
    typeof raw.pattern_code === 'string' &&
    typeof raw.pattern_title === 'string' &&
    typeof raw.pattern_desc === 'string' &&
    raw.example &&
    Array.isArray(raw.sentences)
  ) {
    const example = parseSentenceLine(raw.example);
    const sentences = raw.sentences
      .map(parseSentenceLine)
      .filter((item): item is SentenceLineDTO => Boolean(item));

    if (example && sentences.length > 0) {
      const payload: SentenceLessonPayloadDTO = {
        patternCode: raw.pattern_code as SentenceLessonPayloadDTO['patternCode'],
        patternTitle: raw.pattern_title,
        patternDesc: raw.pattern_desc,
        patternTitleEn,
        patternDescEn,
        example,
        sentences,
        wordIds: wordIds.length > 0 ? wordIds : undefined,
      };
      return payload;
    }
  }

  const payload: VocabLessonPayloadDTO = { wordIds, introNl, introEn };
  return payload;
}

function getOrSeedWordState(wordId: string, nowIso: string, state: PersistedState): SrsStateDTO {
  const existing = state.wordStates[wordId];
  if (existing) return existing;

  const nowTs = Date.parse(nowIso);
  const next: SrsStateDTO = {
    wordId,
    box: 1,
    nextReviewAt: nowIso,
    nextReviewAtTs: nowTs,
    lastReviewAt: null,
    lastReviewAtTs: null,
    correctStreak: 0,
    totalReviews: 0,
    totalLapses: 0,
    createdAt: nowIso,
    createdAtTs: nowTs,
  };
  state.wordStates[wordId] = next;
  return next;
}

function getOrSeedContentState(
  kind: ContentKind,
  contentId: string,
  nowIso: string,
  state: PersistedState
): SrsStateDTO {
  const key = contentKey(kind, contentId);
  const existing = state.contentStates[key];
  if (existing) return existing;

  const nowTs = Date.parse(nowIso);
  const next: SrsStateDTO = {
    wordId: contentId,
    box: 1,
    nextReviewAt: nowIso,
    nextReviewAtTs: nowTs,
    lastReviewAt: null,
    lastReviewAtTs: null,
    correctStreak: 0,
    totalReviews: 0,
    totalLapses: 0,
    createdAt: nowIso,
    createdAtTs: nowTs,
  };
  state.contentStates[key] = next;
  return next;
}

function mapLessonSummary(lesson: RawLesson, state: PersistedState): LessonSummaryDTO {
  return {
    id: lesson.id,
    week: lesson.week,
    title: lesson.title,
    kind: lesson.kind,
    orderIndex: lesson.order_index,
    updatedAt: lesson.updated_at,
    progressStatus: state.lessonProgress[lesson.id]?.status ?? null,
  };
}

function mapLesson(lesson: RawLesson, state: PersistedState): LessonDTO {
  const payload = parseLessonPayload(lesson.payload);
  const wordIds = Array.isArray((payload as { wordIds?: string[] }).wordIds)
    ? (((payload as { wordIds?: string[] }).wordIds as string[]) ?? [])
    : [];

  return {
    id: lesson.id,
    week: lesson.week,
    title: lesson.title,
    kind: lesson.kind,
    orderIndex: lesson.order_index,
    payload,
    words: words.filter((word) => wordIds.includes(word.id)).map(mapWord),
    updatedAt: lesson.updated_at,
    progress: state.lessonProgress[lesson.id] ?? null,
  };
}

function mapDialogueSummary(dialogue: RawDialogue): DialogueSummaryDTO {
  return {
    id: dialogue.id,
    week: dialogue.week,
    scenario: dialogue.scenario,
    title: dialogue.title,
    updatedAt: dialogue.updated_at,
  };
}

function mapDialogue(dialogue: RawDialogue): DialogueDTO {
  return {
    id: dialogue.id,
    week: dialogue.week,
    scenario: dialogue.scenario,
    title: dialogue.title,
    lines: dialogue.lines,
    updatedAt: dialogue.updated_at,
  };
}

function getAllReviewDates(state: PersistedState): string[] {
  return [
    ...state.wordReviewLogs.map((entry) => entry.reviewedAt),
    ...state.contentReviewLogs.map((entry) => entry.reviewedAt),
  ].sort();
}

export async function initApp(): Promise<void> {
  const state = readState();
  if (state.contentVersion !== CONTENT_VERSION) {
    state.contentVersion = CONTENT_VERSION;
    writeState(state);
  }
}

export async function getSettings(): Promise<SettingsDTO> {
  return readState().settings;
}

export async function updateSettings(patch: Partial<SettingsDTO>): Promise<SettingsDTO> {
  const state = readState();
  state.settings = {
    ...state.settings,
    ...patch,
  };
  writeState(state);
  return state.settings;
}

export async function getProgress(
  nowIso: string = new Date().toISOString()
): Promise<ProgressDTO> {
  const state = readState();
  const nowTs = Date.parse(nowIso);
  const startOfDayTs = localStartMs(nowIso);

  const dueCount = words
    .filter((word) => word.is_active === 1)
    .map((word) => getOrSeedWordState(word.id, nowIso, state))
    .filter((item) => item.nextReviewAtTs <= nowTs).length;

  const reviewsTodayCount = getAllReviewDates(state)
    .map((iso) => Date.parse(iso))
    .filter((ts) => ts >= startOfDayTs).length;

  return {
    dailyGoal: state.settings.dailyGoal,
    dueCount,
    reviewsTodayCount,
    totalReviews: state.wordReviewLogs.length + state.contentReviewLogs.length,
    streakCurrent: state.streakCurrent,
    streakBest: state.streakBest,
    lastActiveAt: state.lastActiveAt,
    lastReviewedAt: state.lastReviewedAt,
    contentVersion: state.contentVersion,
  };
}

export async function getTodayPlan(
  limit?: number
): Promise<{ queue: TodayQueueItemDTO[]; progress: ProgressDTO }> {
  const settings = await getSettings();
  const effectiveLimit = limit ?? settings.dailyGoal;
  const queue = await getReviewQueue(effectiveLimit);
  const progress = await getProgress();
  return { queue, progress };
}

export async function getReviewQueue(limit?: number): Promise<TodayQueueItemDTO[]> {
  const state = readState();
  const nowIso = new Date().toISOString();
  const nowTs = Date.parse(nowIso);
  const effectiveLimit = limit ?? state.settings.dailyGoal;

  const queue = words
    .filter((word) => word.is_active === 1)
    .map((word) => ({
      word: mapWord(word),
      state: getOrSeedWordState(word.id, nowIso, state),
    }))
    .filter((item) => item.state.nextReviewAtTs <= nowTs)
    .sort((a, b) => a.state.nextReviewAtTs - b.state.nextReviewAtTs)
    .slice(0, effectiveLimit);

  writeState(state);
  return queue;
}

export async function getReviewQueueByWeek(week: number): Promise<TodayQueueItemDTO[]> {
  const state = readState();
  const nowIso = new Date().toISOString();
  const queue = words
    .filter((word) => word.is_active === 1 && word.week === week)
    .map((word) => ({
      word: mapWord(word),
      state: getOrSeedWordState(word.id, nowIso, state),
    }));

  writeState(state);
  return queue;
}

export async function recordReview(
  wordId: string,
  rating: Rating,
  scheduledAtIso?: string
): Promise<ReviewResultDTO> {
  const state = readState();
  const reviewedAt = new Date().toISOString();
  const prevState = getOrSeedWordState(wordId, reviewedAt, state);
  const prevBox = prevState.box;
  const nextBox = computeNextBox(prevBox, rating);
  const nextReviewAt = computeNextReviewAt(reviewedAt, nextBox, DEFAULT_SRS_CONFIG);
  const scheduledAt = scheduledAtIso ?? prevState.nextReviewAt ?? reviewedAt;
  const reviewedAtTs = Date.parse(reviewedAt);

  const nextState: SrsStateDTO = {
    ...prevState,
    box: nextBox,
    nextReviewAt,
    nextReviewAtTs: Date.parse(nextReviewAt),
    lastReviewAt: reviewedAt,
    lastReviewAtTs: reviewedAtTs,
    correctStreak: rating === 'again' ? 0 : prevState.correctStreak + 1,
    totalReviews: prevState.totalReviews + 1,
    totalLapses: prevState.totalLapses + (rating === 'again' ? 1 : 0),
  };

  const streakUpdate = computeStreakUpdate(
    state.lastReviewedAt,
    reviewedAt,
    state.streakCurrent,
    state.streakBest
  );

  state.wordStates[wordId] = nextState;
  state.wordReviewLogs.push({
    wordId,
    rating,
    reviewedAt,
    scheduledAt,
    prevBox,
    nextBox,
  });
  state.streakCurrent = streakUpdate.streakCurrent;
  state.streakBest = streakUpdate.streakBest;
  state.lastReviewedAt = reviewedAt;
  state.lastActiveAt = reviewedAt;
  writeState(state);

  return {
    wordId,
    rating,
    prevBox,
    nextBox,
    scheduledAt,
    reviewedAt,
    nextReviewAt,
    state: nextState,
    progress: await getProgress(reviewedAt),
  };
}

export async function setLessonProgress(
  lessonId: string,
  status: LessonProgressDTO['status']
): Promise<LessonProgressDTO> {
  const state = readState();
  const now = new Date().toISOString();
  const progress: LessonProgressDTO = {
    lessonId,
    status,
    lastActivityAt: now,
    completedAt: status === 'done' ? now : null,
  };
  state.lessonProgress[lessonId] = progress;
  state.lastActiveAt = now;
  writeState(state);
  return progress;
}

export async function getLesson(lessonId: string): Promise<LessonDTO | null> {
  const state = readState();
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) return null;
  return mapLesson(lesson, state);
}

export async function listLessonsByWeek(week: number): Promise<LessonSummaryDTO[]> {
  const state = readState();
  return lessons
    .filter((lesson) => lesson.week === week)
    .sort((a, b) => a.order_index - b.order_index)
    .map((lesson) => mapLessonSummary(lesson, state));
}

export async function getDialogue(dialogueId: string): Promise<DialogueDTO | null> {
  const dialogue = dialogues.find((item) => item.id === dialogueId);
  return dialogue ? mapDialogue(dialogue) : null;
}

export async function listDialoguesByWeek(week: number): Promise<DialogueSummaryDTO[]> {
  return dialogues.filter((dialogue) => dialogue.week === week).map(mapDialogueSummary);
}

export async function listExercisesByWeek(week: number): Promise<ExerciseDTO[]> {
  return exercises
    .filter((exercise) => exercise.week === week)
    .map((exercise) => ({
      id: exercise.id,
      week: exercise.week,
      kind: exercise.kind,
      prompt: exercise.prompt,
      data: exercise.data,
      updatedAt: exercise.updated_at,
    }));
}

export async function listWeeks(): Promise<number[]> {
  return Array.from(new Set(lessons.map((lesson) => lesson.week))).sort((a, b) => a - b);
}

export async function getThemeProgress(
  week: number,
  nowIso: string = new Date().toISOString()
): Promise<{ totalWords: number; reviewedTodayCount: number; dueCount: number }> {
  const state = readState();
  const nowTs = Date.parse(nowIso);
  const startOfDayTs = localStartMs(nowIso);
  const themeWords = words.filter((word) => word.week === week && word.is_active === 1);
  const reviewedIds = new Set(themeWords.map((word) => word.id));

  const reviewedTodayCount = state.wordReviewLogs.filter((entry) => {
    return reviewedIds.has(entry.wordId) && Date.parse(entry.reviewedAt) >= startOfDayTs;
  }).length;

  const dueCount = themeWords
    .map((word) => getOrSeedWordState(word.id, nowIso, state))
    .filter((item) => item.nextReviewAtTs <= nowTs).length;

  writeState(state);
  return {
    totalWords: themeWords.length,
    reviewedTodayCount,
    dueCount,
  };
}

export async function getContentProgress(
  week: number,
  kind: ContentKind,
  nowIso: string = new Date().toISOString()
): Promise<ContentProgressDTO> {
  const state = readState();
  const nowTs = Date.parse(nowIso);
  const startOfDayTs = localStartMs(nowIso);
  const items =
    kind === 'sentence'
      ? lessons
          .filter((lesson) => lesson.week === week && lesson.kind === 'sentence')
          .map((item) => item.id)
      : dialogues.filter((dialogue) => dialogue.week === week).map((item) => item.id);

  const itemSet = new Set(items);
  const reviewedTodayCount = state.contentReviewLogs.filter((entry) => {
    return (
      entry.kind === kind &&
      itemSet.has(entry.contentId) &&
      Date.parse(entry.reviewedAt) >= startOfDayTs
    );
  }).length;

  const dueCount = items
    .map((id) => getOrSeedContentState(kind, id, nowIso, state))
    .filter((item) => item.nextReviewAtTs <= nowTs).length;

  writeState(state);
  return {
    totalCount: items.length,
    reviewedTodayCount,
    dueCount,
  };
}

export async function recordContentReview(
  contentId: string,
  kind: ContentKind,
  rating: Rating = 'good',
  scheduledAtIso?: string
): Promise<ContentReviewResultDTO> {
  const state = readState();
  const reviewedAt = new Date().toISOString();
  const prevState = getOrSeedContentState(kind, contentId, reviewedAt, state);
  const prevBox = prevState.box;
  const nextBox = computeNextBox(prevBox, rating);
  const nextReviewAt = computeNextReviewAt(reviewedAt, nextBox, DEFAULT_SRS_CONFIG);
  const scheduledAt = scheduledAtIso ?? prevState.nextReviewAt ?? reviewedAt;
  const reviewedAtTs = Date.parse(reviewedAt);
  const key = contentKey(kind, contentId);

  state.contentStates[key] = {
    ...prevState,
    box: nextBox,
    nextReviewAt,
    nextReviewAtTs: Date.parse(nextReviewAt),
    lastReviewAt: reviewedAt,
    lastReviewAtTs: reviewedAtTs,
    correctStreak: rating === 'again' ? 0 : prevState.correctStreak + 1,
    totalReviews: prevState.totalReviews + 1,
    totalLapses: prevState.totalLapses + (rating === 'again' ? 1 : 0),
  };

  const streakUpdate = computeStreakUpdate(
    state.lastReviewedAt,
    reviewedAt,
    state.streakCurrent,
    state.streakBest
  );

  state.contentReviewLogs.push({
    contentId,
    kind,
    rating,
    reviewedAt,
    scheduledAt,
    prevBox,
    nextBox,
  });
  state.streakCurrent = streakUpdate.streakCurrent;
  state.streakBest = streakUpdate.streakBest;
  state.lastReviewedAt = reviewedAt;
  state.lastActiveAt = reviewedAt;
  writeState(state);

  return {
    contentId,
    kind,
    rating,
    prevBox,
    nextBox,
    scheduledAt,
    reviewedAt,
    nextReviewAt,
  };
}

export async function getWeeklyActivity(
  weeksBack: number = 6,
  nowIso: string = new Date().toISOString()
): Promise<ActivitySummaryDTO> {
  const state = readState();
  const nowWeekStart = localWeekStartMs(nowIso);
  const weeksData: WeeklyActivityDTO[] = [];

  for (let i = weeksBack - 1; i >= 0; i -= 1) {
    const start = nowWeekStart - i * 7 * 86400000;
    const end = start + 7 * 86400000;
    const wordsCount = state.wordReviewLogs.filter((entry) => {
      const ts = Date.parse(entry.reviewedAt);
      return ts >= start && ts < end;
    }).length;
    const sentenceCount = state.contentReviewLogs.filter((entry) => {
      const ts = Date.parse(entry.reviewedAt);
      return entry.kind === 'sentence' && ts >= start && ts < end;
    }).length;
    const dialogueCount = state.contentReviewLogs.filter((entry) => {
      const ts = Date.parse(entry.reviewedAt);
      return entry.kind === 'dialogue' && ts >= start && ts < end;
    }).length;

    weeksData.push({
      weekStartMs: start,
      label: formatWeekLabel(start),
      words: wordsCount,
      sentences: sentenceCount,
      dialogues: dialogueCount,
      total: wordsCount + sentenceCount + dialogueCount,
    });
  }

  return {
    weeks: weeksData,
    totals: {
      words: state.wordReviewLogs.length,
      sentences: state.contentReviewLogs.filter((entry) => entry.kind === 'sentence').length,
      dialogues: state.contentReviewLogs.filter((entry) => entry.kind === 'dialogue').length,
      total: state.wordReviewLogs.length + state.contentReviewLogs.length,
    },
  };
}
