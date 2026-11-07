'use client';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '@/lib/theme';
import { useT } from '@/lib/i18n';
import { spring } from '@/lib/motion';

/** Sun ↔ moon that morphs; 44px hit area. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const { t } = useT();
  const reduced = useReducedMotion();
  const dark = theme === 'dark';
  const tr = reduced ? { duration: 0 } : spring.smooth;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t('theme.light') : t('theme.dark')}
      aria-pressed={dark}
      data-testid="theme-toggle"
      className={`relative inline-flex items-center justify-center w-11 h-11 rounded-[8px] text-ink hover:bg-pine-soft transition-colors duration-[120ms] ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <mask id="moon-mask">
            <rect width="24" height="24" fill="white" />
            <motion.circle cx="17" cy="8" fill="black" animate={{ r: dark ? 6.5 : 0, cx: dark ? 17 : 22, cy: dark ? 8 : 2 }} transition={tr} />
          </mask>
        </defs>
        <motion.circle cx="12" cy="12" fill="currentColor" mask="url(#moon-mask)" animate={{ r: dark ? 8.5 : 5 }} transition={tr} />
        <motion.g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" animate={{ opacity: dark ? 0 : 1, scale: dark ? 0.6 : 1, rotate: dark ? 45 : 0 }} transition={tr} style={{ originX: '12px', originY: '12px' }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={12 + Math.cos(a) * 8} y1={12 + Math.sin(a) * 8} x2={12 + Math.cos(a) * 10.5} y2={12 + Math.sin(a) * 10.5} />;
          })}
        </motion.g>
      </svg>
    </button>
  );
}
