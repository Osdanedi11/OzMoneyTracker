import { Platform } from 'react-native';

export const colors = {
  bgPrimary: '#0D1117',
  bgSecondary: '#161B22',
  cardSurface: '#1C2128',
  cardBorder: '#30363D',
  primary: '#4F46E5',
  accent: '#06B6D4',
  gradientPrimary: ['#4F46E5', '#06B6D4'] as const,
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  tabBarBg: '#161B22',
  tabBarBorder: '#30363D',
  tabActive: '#4F46E5',
  tabInactive: '#6E7681',
};

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
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
};

export const fonts = {
  display: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }),
  body: Platform.select({ ios: 'System', android: 'Roboto', default: 'Arial, sans-serif' }),
};

export const categoryColors = [
  '#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#8B5CF6',
  '#F97316', '#06B6D4', '#EF4444', '#84CC16', '#E879F9',
];
