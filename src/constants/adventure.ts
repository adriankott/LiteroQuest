import { NodeType } from '../types/adventure';

export const ADVENTURE_FLOORS = 52;

// Act boundaries (boss floor is the last floor of each act)
// Acts: 0-8 (boss@8), 9-17 (boss@17), 18-26 (boss@26), 27-35 (boss@35), 36-44 (boss@44), 45-51 (boss@51)
export const BOSS_FLOORS = [8, 17, 26, 35, 44, 51];
export const ELITE_FLOORS = [3, 12, 21, 30, 39, 48];
export const TREASURE_FLOORS = [5, 14, 23, 32, 41, 50];
export const REST_FLOORS = [6, 15, 24, 33, 42, 49];

export const ACT_LABELS: Record<number, number> = {
  0: 1, 9: 2, 18: 3, 27: 4, 36: 5, 45: 6,
};

export const NODE_ROUND_COUNTS: Record<NodeType, number> = {
  phonics: 5,
  words: 5,
  alphabet: 5,
  elite: 8,
  boss: 10,
  treasure: 0,
  rest: 0,
};

export const NODE_EMOJIS: Record<NodeType, string> = {
  phonics: '🔊',
  words: '📖',
  alphabet: '🔤',
  elite: '🔥',
  boss: '👑',
  treasure: '⭐',
  rest: '💤',
};

export const NODE_COLORS: Record<NodeType, string> = {
  phonics: '#60A5FA',
  words: '#34D399',
  alphabet: '#A78BFA',
  elite: '#FB923C',
  boss: '#FF6B35',
  treasure: '#FBBF24',
  rest: '#94A3B8',
};

export function getActForFloor(floor: number): number {
  if (floor <= 8) return 1;
  if (floor <= 17) return 2;
  if (floor <= 26) return 3;
  if (floor <= 35) return 4;
  if (floor <= 44) return 5;
  return 6;
}

export function getDifficultyForFloor(floor: number): 1 | 2 | 3 {
  if (floor <= 17) return 1;
  if (floor <= 35) return 2;
  return 3;
}

export function isBossFloor(floor: number): boolean {
  return BOSS_FLOORS.includes(floor);
}

export function isActStart(floor: number): boolean {
  return floor in ACT_LABELS;
}
