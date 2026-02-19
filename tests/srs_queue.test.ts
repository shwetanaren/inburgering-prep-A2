import { describe, expect, it } from 'vitest';
import { selectDueItems } from '../packages/srs';

const iso = (s: string) => new Date(s).toISOString();

describe('selectDueItems', () => {
  it('returns items due at or before now, ordered by nextReviewAt', () => {
    const now = iso('2026-02-19T10:00:00Z');
    const items = [
      { id: 'a', nextReviewAt: iso('2026-02-19T09:00:00Z') },
      { id: 'b', nextReviewAt: iso('2026-02-19T10:00:00Z') },
      { id: 'c', nextReviewAt: iso('2026-02-19T08:00:00Z') },
      { id: 'd', nextReviewAt: iso('2026-02-20T08:00:00Z') },
    ];

    const result = selectDueItems(items, now, 10);
    expect(result.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('respects the limit', () => {
    const now = iso('2026-02-19T10:00:00Z');
    const items = [
      { id: 'a', nextReviewAt: iso('2026-02-19T08:00:00Z') },
      { id: 'b', nextReviewAt: iso('2026-02-19T07:00:00Z') },
      { id: 'c', nextReviewAt: iso('2026-02-19T06:00:00Z') },
    ];

    const result = selectDueItems(items, now, 2);
    expect(result.map((i) => i.id)).toEqual(['c', 'b']);
  });

  it('returns empty if nothing due', () => {
    const now = iso('2026-02-19T10:00:00Z');
    const items = [
      { id: 'a', nextReviewAt: iso('2026-02-20T08:00:00Z') },
      { id: 'b', nextReviewAt: iso('2026-02-21T07:00:00Z') },
    ];

    const result = selectDueItems(items, now, 10);
    expect(result).toEqual([]);
  });
});
