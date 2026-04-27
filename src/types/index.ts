export interface Profile {
  id: number;
  name: string;
  avatar: string;
  language: string;
  created_at: number;
}

export interface Progress {
  id: number;
  profile_id: number;
  lesson_type: 'alphabet' | 'phonics' | 'words';
  lesson_id: string;
  stars: number;
  attempts: number;
  completed_at: number | null;
}

export interface Setting {
  key: string;
  value: string;
}

export interface AlphabetLetter {
  letter: string;
  example: string;
  emoji: string;
  phonetic: string;
  color: string;
}

export interface Word {
  word: string;
  emoji: string;
  category: string;
  difficulty: 1 | 2 | 3;
}

export type SupportedLanguage = 'ro' | 'en';

export interface GameResult {
  score: number;
  total: number;
  stars: number;
}

export const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐼', '🦋', '🐬', '🦄'];

export const TOTAL_ROUNDS = 10;
