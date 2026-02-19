export type Rating = 'again' | 'good' | 'easy';

export type SrsConfig = {
  intervalsDays: number[]; // [1, 3, 7, 14, 30]
};

export const DEFAULT_SRS_CONFIG: SrsConfig = {
  intervalsDays: [1, 3, 7, 14, 30],
};

const clampBox = (box: number) => Math.min(5, Math.max(1, box));

export function computeNextBox(prevBox: number, rating: Rating): number {
  const safePrev = clampBox(prevBox);
  if (rating === 'again') return 1;
  if (rating === 'easy') return clampBox(safePrev + 2);
  return clampBox(safePrev + 1); // good
}

export function computeNextReviewAt(
  nowIso: string,
  nextBox: number,
  config: SrsConfig = DEFAULT_SRS_CONFIG
): string {
  const safeBox = clampBox(nextBox);
  const idx = Math.min(config.intervalsDays.length - 1, safeBox - 1);
  const days = config.intervalsDays[idx] ?? 1;
  const now = new Date(nowIso);
  const next = new Date(now.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

export type DueItem = {
  nextReviewAt: string;
};

export function selectDueItems<T extends DueItem>(
  items: T[],
  nowIso: string,
  limit: number
): T[] {
  const now = Date.parse(nowIso);
  return items
    .filter((i) => Date.parse(i.nextReviewAt) <= now)
    .sort(
      (a, b) => Date.parse(a.nextReviewAt) - Date.parse(b.nextReviewAt)
    )
    .slice(0, limit);
}
