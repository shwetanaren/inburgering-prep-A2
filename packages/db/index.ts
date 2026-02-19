import * as SQLite from 'expo-sqlite';
import { LATEST_SCHEMA_VERSION, migrations } from './migrations';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('app.db');
  }
  return dbPromise;
}

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  return row?.user_version ?? 0;
}

async function hasColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table});`
  );
  return rows.some((row) => row.name === column);
}

async function isSchemaV2(db: SQLite.SQLiteDatabase): Promise<boolean> {
  const checks = await Promise.all([
    hasColumn(db, 'srs_state', 'next_review_at_ts'),
    hasColumn(db, 'srs_state', 'last_review_at_ts'),
    hasColumn(db, 'srs_state', 'created_at_ts'),
    hasColumn(db, 'reviews_log', 'scheduled_at_ts'),
    hasColumn(db, 'reviews_log', 'reviewed_at_ts'),
    hasColumn(db, 'lesson_progress', 'profile_id'),
    hasColumn(db, 'lesson_progress', 'created_at_ts'),
  ]);
  return checks.every(Boolean);
}

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  let current = await getUserVersion(db);

  if (current < 2 && (await isSchemaV2(db))) {
    await db.execAsync('BEGIN;');
    try {
      await db.execAsync('PRAGMA user_version = 2;');
      await db.execAsync('COMMIT;');
    } catch (err) {
      await db.execAsync('ROLLBACK;');
      throw err;
    }
    current = 2;
  }

  const pending = migrations.filter((m) => m.version > current);
  for (const migration of pending) {
    await db.execAsync('BEGIN;');
    try {
      await db.execAsync(migration.upSql);
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
      await db.execAsync('COMMIT;');
    } catch (err) {
      await db.execAsync('ROLLBACK;');
      throw err;
    }
  }

  if (current === 0 && LATEST_SCHEMA_VERSION === 0) {
    await db.execAsync(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION};`);
  }
}

async function ensureSingletonRows(): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO user_settings (id, daily_goal, notifications_enabled, created_at, updated_at)
     SELECT 1, 30, 0, ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE id = 1);`,
    [now, now]
  );

  await db.runAsync(
    `INSERT INTO app_state (id, streak_current, streak_best, last_active_at, last_reviewed_at, content_version)
     SELECT 1, 0, 0, NULL, NULL, ?
     WHERE NOT EXISTS (SELECT 1 FROM app_state WHERE id = 1);`,
    ['v0.0.0']
  );
}

export async function initDb(): Promise<void> {
  await runMigrations();
  await ensureSingletonRows();
}
