import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'formforge-theme';

/**
 * useTheme — manages light/dark theme via data-theme on <html>.
 * Persists preference to localStorage and respects system preference on first load.
 */
export default function useTheme() {
  const getInitial = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
}
