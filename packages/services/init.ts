import { initDb } from '../db';
import { loadBundledContentIfNeeded } from '../content';

let initPromise: Promise<void> | null = null;

export async function initApp(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await initDb();
      await loadBundledContentIfNeeded();
    })();
  }
  return initPromise;
}
