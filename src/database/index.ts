import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('literoquest.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profiles (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      avatar     TEXT    NOT NULL,
      language   TEXT    NOT NULL DEFAULT 'ro',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id   INTEGER NOT NULL,
      lesson_type  TEXT    NOT NULL,
      lesson_id    TEXT    NOT NULL,
      stars        INTEGER NOT NULL DEFAULT 0,
      attempts     INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS adventure_runs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id      INTEGER NOT NULL,
      current_floor   INTEGER NOT NULL DEFAULT 0,
      last_node_id    TEXT,
      completed_nodes TEXT    NOT NULL DEFAULT '{}',
      map_data        TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'active',
      started_at      INTEGER NOT NULL,
      completed_at    INTEGER,
      total_stars     INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    );
  `);
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}
