import { describe, expect, it } from 'vitest';
import { importContentPack, bundledPack, DbLike, loadContentPackIfNeeded } from '../packages/content';

type Call = { sql: string; params?: unknown[] };

class MockDb implements DbLike {
  public execCalls: Call[] = [];
  public runCalls: Call[] = [];
  public firstCalls: Call[] = [];

  async execAsync(sql: string): Promise<void> {
    this.execCalls.push({ sql });
  }

  async runAsync(sql: string, params?: unknown[]): Promise<void> {
    this.runCalls.push({ sql, params });
  }

  async getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null> {
    this.firstCalls.push({ sql, params });
    return null;
  }
}

describe('importContentPack', () => {
  it('wraps each table import in a transaction', async () => {
    const db = new MockDb();
    await importContentPack(db, bundledPack);

    const begins = db.execCalls.filter((c) => c.sql === 'BEGIN;').length;
    const commits = db.execCalls.filter((c) => c.sql === 'COMMIT;').length;
    const rollbacks = db.execCalls.filter((c) => c.sql === 'ROLLBACK;').length;

    expect(begins).toBe(4);
    expect(commits).toBe(4);
    expect(rollbacks).toBe(0);
  });

  it('deactivates missing words and seeds srs_state', async () => {
    const db = new MockDb();
    await importContentPack(db, bundledPack);

    const hasDeactivate = db.runCalls.some((c) =>
      c.sql.includes('UPDATE words SET is_active = 0')
    );
    const hasSeed = db.runCalls.some((c) =>
      c.sql.includes('INSERT INTO srs_state') && c.sql.includes('LEFT JOIN srs_state')
    );

    expect(hasDeactivate).toBe(true);
    expect(hasSeed).toBe(true);
  });
});

describe('loadContentPackIfNeeded', () => {
  it('re-runs import when build_hash changes', async () => {
    const db = new MockDb();
    db.getFirstAsync = async () => ({ content_version: bundledPack.version, build_hash: 'old-hash' });

    await loadContentPackIfNeeded(db, bundledPack, 'new-hash');

    const begins = db.execCalls.filter((c) => c.sql === 'BEGIN;').length;
    expect(begins).toBe(5);
  });
});
