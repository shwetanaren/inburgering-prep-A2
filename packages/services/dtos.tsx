import type { Rating } from '../srs';

export type WordDTO = {
  id: string;
  week: number;
  topic: string;
  lemma: string;
  article: 'de' | 'het' | null;
  translation: string;
  exampleNl: string | null;
  exampleEn: string | null;
  audioUri: string | null;
  tags: string[];
  isActive: boolean;
  updatedAt: string;
};

export type SrsStateDTO = {
  wordId: string;
  box: number;
  nextReviewAt: string;
  nextReviewAtTs: number;
  lastReviewAt: string | null;
  lastReviewAtTs: number | null;
  correctStreak: number;
  totalReviews: number;
  totalLapses: number;
  createdAt: string;
  createdAtTs: number;
};

export type TodayQueueItemDTO = {
  word: WordDTO;
  state: SrsStateDTO;
};

export type LessonProgressDTO = {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'done';
  lastActivityAt: string | null;
  completedAt: string | null;
};

export type VocabLessonPayloadDTO = {
  wordIds: string[];
  introNl?: string;
  introEn?: string;
};

export type SentenceLineDTO = {
  nl: string;
  en: string;
};

export type SentenceLessonPayloadDTO = {
  patternCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  patternTitle: string;
  patternDesc: string;
  patternTitleEn?: string;
  patternDescEn?: string;
  example: SentenceLineDTO;
  sentences: SentenceLineDTO[];
  wordIds?: string[];
};

export type LessonPayloadDTO = VocabLessonPayloadDTO | SentenceLessonPayloadDTO;

export type LessonDTO = {
  id: string;
  week: number;
  title: string;
  kind: string;
  orderIndex: number;
  payload: LessonPayloadDTO;
  words: WordDTO[];
  updatedAt: string;
  progress: LessonProgressDTO | null;
};

export type LessonSummaryDTO = {
  id: string;
  week: number;
  title: string;
  kind: string;
  orderIndex: number;
  updatedAt: string;
  progressStatus: LessonProgressDTO['status'] | null;
};

export type DialogueLineDTO = {
  speaker: string;
  nl: string;
  en: string;
};

export type DialogueDTO = {
  id: string;
  week: number;
  scenario: string;
  title: string;
  lines: DialogueLineDTO[];
  updatedAt: string;
};

export type DialogueSummaryDTO = {
  id: string;
  week: number;
  scenario: string;
  title: string;
  updatedAt: string;
};

export type ExerciseDTO = {
  id: string;
  week: number;
  kind: string;
  prompt: string;
  data: Record<string, unknown>;
  updatedAt: string;
};

export type ProgressDTO = {
  dailyGoal: number;
  dueCount: number;
  reviewsTodayCount: number;
  totalReviews: number;
  streakCurrent: number;
  streakBest: number;
  lastActiveAt: string | null;
  lastReviewedAt: string | null;
  contentVersion: string;
};

export type ThemeProgressDTO = {
  week: number;
  totalWords: number;
  reviewedTodayCount: number;
  dueCount: number;
};

export type ContentKind = 'sentence' | 'dialogue';

export type ContentProgressDTO = {
  totalCount: number;
  reviewedTodayCount: number;
  dueCount: number;
};

export type ReviewResultDTO = {
  wordId: string;
  rating: Rating;
  prevBox: number;
  nextBox: number;
  scheduledAt: string;
  reviewedAt: string;
  nextReviewAt: string;
  state: SrsStateDTO;
  progress: ProgressDTO;
};

export type ContentReviewResultDTO = {
  contentId: string;
  kind: ContentKind;
  rating: Rating;
  prevBox: number;
  nextBox: number;
  scheduledAt: string;
  reviewedAt: string;
  nextReviewAt: string;
};

export type WeeklyActivityDTO = {
  weekStartMs: number;
  label: string;
  words: number;
  sentences: number;
  dialogues: number;
  total: number;
};

export type ActivitySummaryDTO = {
  weeks: WeeklyActivityDTO[];
  totals: {
    words: number;
    sentences: number;
    dialogues: number;
    total: number;
  };
};

export type SettingsDTO = {
  dailyGoal: number;
  notificationsEnabled: boolean;
};
