import { useState, useEffect } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

export function useDashboardTheme() {
  const [themePref, setThemePref] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('authx_dashboard_theme') as ThemePreference | null;
    if (saved) {
      setThemePref(saved);
    }
  }, []);

  // Sync preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('authx_dashboard_theme', themePref);
  }, [themePref]);

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
