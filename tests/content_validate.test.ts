import { describe, expect, it } from 'vitest';
import { bundledPack, validateContentPack } from '../packages/content';

describe('validateContentPack', () => {
  it('accepts the bundled pack', () => {
    expect(() => validateContentPack(bundledPack)).not.toThrow();
  });

  it('rejects missing word.id', () => {
    const broken = {
      ...bundledPack,
      words: [{
        // @ts-expect-error intentional
        id: '',
        week: 1,
        topic: 'x',
        lemma: 'x',
        article: null,
        translation: 'x',
        updated_at: '2026-02-19T00:00:00.000Z',
      }],
    };
    expect(() => validateContentPack(broken)).toThrow(/word\.id/);
  });

  it('rejects lessons referencing missing words', () => {
    const broken = {
      ...bundledPack,
      lessons: [
        {
          ...bundledPack.lessons[0],
          payload: { word_ids: ['w_missing'] },
        },
      ],
    };
    expect(() => validateContentPack(broken)).toThrow(/missing word/);
  });

  it('rejects invalid ID prefixes', () => {
    const broken = {
      ...bundledPack,
      words: [
        {
          ...bundledPack.words[0],
          id: 'word_01',
        },
      ],
    };
    expect(() => validateContentPack(broken)).toThrow(/word\\.id must start/);
  });
});
