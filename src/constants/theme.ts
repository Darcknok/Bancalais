import '@/global.css';

import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

export const Accent = '#0EA5E9';

export const Colors = {
  light: {
    text: '#1C1917',
    textSecondary: '#8C8882',
    background: '#FAFAF8',
    backgroundElement: '#F5F2ED',
    backgroundSelected: '#EBE7E0',
    primary: '#1C1917',
    primaryDark: '#1C1917',
    accent: Accent,
    danger: '#DC2626',
    border: '#E5E0D8',
    hairline: 'rgba(28,25,23,0.06)',
    cardOuter: 'rgba(28,25,23,0.03)',
    overlay: 'rgba(28,25,23,0.5)',
    success: '#059669',
  },
  dark: {
    text: '#F5F4F0',
    textSecondary: '#A8A29E',
    background: '#0F0E0C',
    backgroundElement: '#1C1917',
    backgroundSelected: '#292524',
    primary: '#F5F4F0',
    primaryDark: '#F5F4F0',
    accent: '#38BDF8',
    danger: '#F87171',
    border: '#292524',
    hairline: 'rgba(245,244,240,0.06)',
    cardOuter: 'rgba(245,244,240,0.02)',
    overlay: 'rgba(0,0,0,0.7)',
    success: '#34D399',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 80,
  eight: 120,
} as const;

const iosShadows: Record<string, ViewStyle> = {
  soft: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  medium: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  tab: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
};

const defaultShadows: Record<string, ViewStyle> = {
  soft: { elevation: 2 },
  medium: { elevation: 4 },
  tab: { elevation: 6 },
};

export const Shadows: Record<string, ViewStyle> = Platform.select({
  ios: iosShadows,
  default: defaultShadows,
})!;

export const Radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  outer: 20,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
