import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'bancalais_theme';

function createStorage() {
  return {
    async get(key: string): Promise<string | null> {
      try {
        const { getItemAsync } = await import('expo-secure-store');
        return await getItemAsync(key);
      } catch {
        try { return localStorage.getItem(key); } catch { return null; }
      }
    },
    async set(key: string, value: string) {
      try {
        const { setItemAsync } = await import('expo-secure-store');
        await setItemAsync(key, value);
      } catch {
        try { localStorage.setItem(key, value); } catch {}
      }
    },
  };
}

const storage = createStorage();

const ThemeModeContext = createContext<{
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}>({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
});

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.get(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        setMode(stored);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) {
      storage.set(THEME_KEY, mode);
    }
  }, [mode, ready]);

  const toggle = useCallback(() => setMode(prev => (prev === 'light' ? 'dark' : 'light')), []);

  return (
    <ThemeModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
