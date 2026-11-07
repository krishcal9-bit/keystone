'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
import { THEME_KEY as KEY } from './themeScript';

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };
const ThemeCtx = createContext<Ctx>({ theme: 'light', setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') setThemeState(t);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light', false);
      } catch {}
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = useCallback((t: Theme, persist = true) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    if (persist) {
      try { localStorage.setItem(KEY, t); } catch {}
    }
    window.dispatchEvent(new CustomEvent('keystone:theme', { detail: t }));
  }, []);

  const value = useMemo<Ctx>(() => ({
    theme,
    setTheme: (t) => apply(t),
    toggle: () => apply(theme === 'dark' ? 'light' : 'dark'),
  }), [theme, apply]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() { return useContext(ThemeCtx); }
export const isDark = (t: Theme) => t === 'dark';
