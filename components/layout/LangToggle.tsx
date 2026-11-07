'use client';
import { motion, useReducedMotion } from 'motion/react';
import { useT, type Lang } from '@/lib/i18n';
import { spring } from '@/lib/motion';

export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useT();
  const reduced = useReducedMotion();
  const opts: Lang[] = ['en', 'es'];
  return (
    <div role="radiogroup" aria-label={t('lang.toggle')} className={`inline-flex h-11 items-center rounded-[8px] p-1 bg-transparent ${className}`} data-testid="lang-toggle">
      {opts.map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={`relative h-9 min-w-9 px-2 rounded-[6px] text-[13px] font-semibold uppercase tracking-wide transition-colors duration-[120ms] ${lang === l ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
        >
          {lang === l && <motion.span layoutId="lang-pill" className="absolute inset-0 rounded-[6px] bg-pine-soft" transition={reduced ? { duration: 0 } : spring.snappy} />}
          <span className="relative z-[1]">{l}</span>
        </button>
      ))}
    </div>
  );
}
