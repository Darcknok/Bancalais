import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { ThemeModeProvider, useThemeMode } from '@/hooks/use-theme-mode';

function TestComponent() {
  const { mode, toggle } = useThemeMode();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Pressable testID="toggle" onPress={toggle}>
        <Text>Toggle</Text>
      </Pressable>
    </>
  );
}

describe('ThemeModeProvider', () => {
  it('starts with light mode by default', async () => {
    await render(
      <ThemeModeProvider>
        <TestComponent />
      </ThemeModeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('light');
  });

  it('toggles between light and dark', async () => {
    await render(
      <ThemeModeProvider>
        <TestComponent />
      </ThemeModeProvider>,
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('light');

    fireEvent.press(screen.getByTestId('toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    });

    fireEvent.press(screen.getByTestId('toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('light');
    });
  });
});
