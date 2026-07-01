import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';

export function useTheme() {
  const { mode } = useThemeMode();
  return Colors[mode];
}
