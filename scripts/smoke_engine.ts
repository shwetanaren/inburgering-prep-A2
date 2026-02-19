import { initApp } from '../packages/services/init';
import { getTodayQueue, reviewWord } from '../packages/services/local';
import { getDb } from '../packages/db';

function nowIso(): string {
  return new Date().toISOString();
}

async function getSrsStates(wordIds: string[]) {
  if (wordIds.length === 0) return [] as Array<Record<string, unknown>>;
  const db = await getDb();
  const placeholders = wordIds.map(() => '?').join(',');
  return await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM srs_state WHERE word_id IN (${placeholders});`,
    wordIds
  );
}

function indexByWordId(rows: Array<Record<string, unknown>>) {
  const map = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = row.word_id as string;
    map.set(key, row);
  }
  return map;
}

function diffStates(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) {
      changes[key] = { from: before[key], to: after[key] };
    }
  }
  return changes;
}

export async function runSmokeEngine(): Promise<void> {
  console.log('[smoke] init app...');
  await initApp();

  const initialQueue = await getTodayQueue(30, nowIso());
  console.log(`[smoke] initial queue length: ${initialQueue.length}`);

  const reviewItems = initialQueue.slice(0, 3);
  const reviewIds = reviewItems.map((i) => i.word.id);

  const beforeStates = await getSrsStates(reviewIds);
  const beforeMap = indexByWordId(beforeStates);

  for (const item of reviewItems) {
    await reviewWord({
      wordId: item.word.id,
      rating: 'good',
      scheduledAt: item.state.next_review_at,
      reviewedAt: nowIso(),
    });
  }

  const updatedQueue = await getTodayQueue(30, nowIso());
  console.log(`[smoke] updated queue length: ${updatedQueue.length}`);

  const afterStates = await getSrsStates(reviewIds);
  const afterMap = indexByWordId(afterStates);

  for (const wordId of reviewIds) {
    const before = beforeMap.get(wordId);
    const after = afterMap.get(wordId);
    if (!before || !after) continue;
    const changes = diffStates(before, after);
    console.log(`[smoke] srs_state changes for ${wordId}:`, changes);
  }
}

// Optional manual run: import and call runSmokeEngine() from a dev-only screen.
