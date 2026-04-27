import { Profile, Progress, Setting } from '../types';
import { getDatabase } from './index';

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  return getDatabase().getAllAsync<Profile>(
    'SELECT * FROM profiles ORDER BY created_at ASC',
  );
}

export async function createProfile(
  name: string,
  avatar: string,
  language: string,
): Promise<number> {
  const result = await getDatabase().runAsync(
    'INSERT INTO profiles (name, avatar, language, created_at) VALUES (?, ?, ?, ?)',
    [name, avatar, language, Date.now()],
  );
  return result.lastInsertRowId;
}

export async function deleteProfile(id: number): Promise<void> {
  await getDatabase().runAsync('DELETE FROM profiles WHERE id = ?', [id]);
  await getDatabase().runAsync('DELETE FROM progress WHERE profile_id = ?', [id]);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Setting[]> {
  return getDatabase().getAllAsync<Setting>('SELECT * FROM settings');
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await getDatabase().getFirstAsync<Setting>(
    'SELECT * FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  await getDatabase().runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function getProgressForProfile(profileId: number): Promise<Progress[]> {
  return getDatabase().getAllAsync<Progress>(
    'SELECT * FROM progress WHERE profile_id = ?',
    [profileId],
  );
}

export async function upsertProgress(
  profileId: number,
  lessonType: string,
  lessonId: string,
  stars: number,
): Promise<void> {
  const existing = await getDatabase().getFirstAsync<Progress>(
    'SELECT * FROM progress WHERE profile_id = ? AND lesson_type = ? AND lesson_id = ?',
    [profileId, lessonType, lessonId],
  );

  if (existing) {
    const newStars = Math.max(existing.stars, stars);
    await getDatabase().runAsync(
      'UPDATE progress SET stars = ?, attempts = attempts + 1, completed_at = ? WHERE id = ?',
      [newStars, Date.now(), existing.id],
    );
  } else {
    await getDatabase().runAsync(
      'INSERT INTO progress (profile_id, lesson_type, lesson_id, stars, attempts, completed_at) VALUES (?, ?, ?, ?, 1, ?)',
      [profileId, lessonType, lessonId, stars, Date.now()],
    );
  }
}

export async function getTotalStars(profileId: number): Promise<number> {
  const row = await getDatabase().getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(stars), 0) as total FROM progress WHERE profile_id = ?',
    [profileId],
  );
  return row?.total ?? 0;
}

export async function getBestScore(
  profileId: number,
  lessonType: string,
): Promise<number> {
  const row = await getDatabase().getFirstAsync<{ best: number }>(
    'SELECT COALESCE(MAX(stars), 0) as best FROM progress WHERE profile_id = ? AND lesson_type = ?',
    [profileId, lessonType],
  );
  return row?.best ?? 0;
}
