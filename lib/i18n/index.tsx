'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en, type DictKey } from './en';
import { es } from './es';

export type Lang = 'en' | 'es';
export type ContentLang = 'en' | 'es' | 'vi' | 'ko';
const KEY = 'keystone:v1:lang';
const dicts: Record<Lang, Record<DictKey, string>> = { en, es };

export const contentLangNames: Record<ContentLang, string> = { en: 'English', es: 'Español', vi: 'Tiếng Việt', ko: '한국어' };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
};
const I18nCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => en[k] });

export function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => {
    const l = document.documentElement.getAttribute('data-lang');
    if (l === 'es' || l === 'en') setLangState(l);
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.setAttribute('data-lang', l);
    document.documentElement.lang = l;
    try { localStorage.setItem(KEY, l); } catch {}
  }, []);
  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    t: (key, vars) => format(dicts[lang][key] ?? en[key] ?? key, vars),
  }), [lang, setLang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useT() { return useContext(I18nCtx); }
export type { DictKey };
