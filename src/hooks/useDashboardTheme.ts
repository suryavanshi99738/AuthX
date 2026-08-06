import { useState, useEffect, useCallback } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const DASHBOARD_THEME_KEY = 'authx_dashboard_theme';
const EVENT_NAME = 'authx_dashboard_theme_change';

function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(DASHBOARD_THEME_KEY) as ThemePreference | null;
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'light';
}

export function useDashboardTheme() {
  const [themePref, setThemePrefState] = useState<ThemePreference>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Listen for storage / custom sync events across components
  useEffect(() => {
    const handleSync = () => {
      setThemePrefState(getStoredTheme());
    };

    window.addEventListener(EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const setThemePref = useCallback((newPref: ThemePreference) => {
    localStorage.setItem(DASHBOARD_THEME_KEY, newPref);
    setThemePrefState(newPref);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  // Resolve theme based on preference and system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const resolveTheme = () => {
      if (themePref === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(themePref);
      }
    };

    resolveTheme();

    const listener = (e: MediaQueryListEvent) => {
      if (themePref === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themePref]);

  return { themePref, setThemePref, resolvedTheme };
}
