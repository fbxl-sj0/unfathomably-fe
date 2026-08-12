import { useEffect } from 'react';

import { useAppSelector } from './useAppSelector.ts';
import { useSettings } from './useSettings.ts';
import { useSystemTheme } from './useSystemTheme.ts';

type Theme = 'light' | 'dark' | 'black';
type ThemeMode = Theme | 'system';

const THEME_STORAGE_KEY = 'unfathomably:theme-mode';

const readStoredTheme = (): ThemeMode | undefined => {
  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (theme === 'system' || theme === 'light' || theme === 'dark' || theme === 'black') {
      return theme;
    }
  } catch {
    // Hardened browsers may expose localStorage while refusing access to it.
  }

  return undefined;
};

/**
 * Returns the actual theme being displayed (eg "light" or "dark")
 * regardless of whether that's by system theme or direct setting.
 */
const useTheme = (): Theme => {
  const { themeMode } = useSettings();
  const hasAccountTheme = useAppSelector((state) => state.settings.has('themeMode'));
  const systemTheme = useSystemTheme();
  const selectedTheme = hasAccountTheme ? themeMode : readStoredTheme() || themeMode;

  useEffect(() => {
    if (!hasAccountTheme) return;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Theme rendering must continue when browser storage is unavailable.
    }
  }, [hasAccountTheme, themeMode]);

  return selectedTheme === 'system' ? systemTheme : selectedTheme;
};

export { useTheme };
