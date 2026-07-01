import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
  noPadding?: boolean;
  accent?: boolean;
};

export function DoubleBezelCard({ children, style, gap = 8, noPadding, accent }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.outer,
        { backgroundColor: accent ? theme.accent + '12' : theme.hairline },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          { backgroundColor: theme.backgroundElement, gap },
          noPadding && { padding: 0 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radii.outer,
    padding: 1.5,
  },
  inner: {
    borderRadius: Radii.xl,
    padding: 20,
  },
});
