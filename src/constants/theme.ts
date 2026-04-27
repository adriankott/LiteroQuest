export const colors = {
  primary: '#FF6B35',
  primaryLight: '#FFB299',
  primaryDark: '#CC4A1A',
  secondary: '#4ECDC4',
  secondaryLight: '#A8EDEA',
  accent: '#FFE66D',
  accentDark: '#FFCC00',
  success: '#95E77E',
  successDark: '#52B788',
  danger: '#FF6B6B',
  dangerLight: '#FFB3B3',
  purple: '#A78BFA',
  purpleLight: '#DDD6FE',
  pink: '#F472B6',
  pinkLight: '#FBCFE8',
  teal: '#4ECDC4',
  orange: '#FF6B35',
  background: '#FFF9F0',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  textMuted: '#B2BEC3',
  border: '#DFE6E9',
  overlay: 'rgba(0,0,0,0.45)',
};

export const letterColors = [
  '#FF6B35', '#4ECDC4', '#A78BFA', '#F472B6',
  '#FFE66D', '#95E77E', '#60A5FA', '#FB923C',
  '#34D399', '#F87171', '#818CF8', '#FBBF24',
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  hero: 72,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
