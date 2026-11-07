'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { Lockup } from '@/components/brand/Lockup';
import { ThemeToggle } from './ThemeToggle';
import { LangToggle } from './LangToggle';
import { useT } from '@/lib/i18n';
import { spring, dur, ease } from '@/lib/motion';

const nav = [
  { href: '/sites', key: 'nav.sites' },
  { href: '/scan', key: 'nav.scan' },
  { href: '/plan/oakfield-community-church', key: 'nav.plan', match: '/plan' },
  { href: '/pipeline', key: 'nav.pipeline' },
  { href: '/ask', key: 'nav.ask' },
] as const;

export function Header() {
  const pathname = usePathname() ?? '/';
  const { t } = useT();
  const reduced = useReducedMotion();
  const landing = pathname === '/';
  const [scrolled, setScrolled] = useState(!landing);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!landing) { setScrolled(true); return; }
    const el = document.getElementById('landing-scroll');
    const target: HTMLElement | Window = el ?? window;
    const onScroll = () => {
      const y = el ? el.scrollTop : window.scrollY;
      setScrolled(y > 24);
    };
    onScroll();
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [landing, pathname]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const solid = scrolled || open;

  return (
    <header
      id="site-header"
      data-testid="header"
      className={`fixed top-0 inset-x-0 z-50 h-16 transition-[background-color,border-color,backdrop-filter] duration-200 ${solid ? 'bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-md border-b border-line' : 'bg-transparent border-b border-transparent'}`}
    >
      <div className="h-full mx-auto max-w-[1440px] px-5 md:px-10 lg:px-20 flex items-center justify-between gap-4">
        <Lockup size={22} tagline={false} />
        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {nav.map((n) => {
            const match = 'match' in n ? n.match : n.href;
            const active = pathname === match || pathname.startsWith(match + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`relative h-11 px-3 inline-flex items-center rounded-[8px] text-[15px] font-medium transition-colors duration-[120ms] ${active ? 'text-ink' : 'text-ink-2 hover:text-ink hover:bg-pine-soft'}`}
              >
                {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-[8px] bg-pine-soft" transition={reduced ? { duration: 0 } : spring.snappy} />}
                <span className="relative z-[1]">{t(n.key)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <LangToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-[8px] text-ink hover:bg-pine-soft"
            aria-label={t('nav.menu')}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <motion.line x1="3" x2="17" animate={open ? { y1: 10, y2: 10, rotate: 45 } : { y1: 6, y2: 6, rotate: 0 }} transition={spring.snappy} style={{ originX: '10px', originY: '10px' }} />
              <motion.line x1="3" x2="17" y1="10" y2="10" animate={{ opacity: open ? 0 : 1 }} transition={{ duration: dur.micro }} />
              <motion.line x1="3" x2="17" animate={open ? { y1: 10, y2: 10, rotate: -45 } : { y1: 14, y2: 14, rotate: 0 }} transition={spring.snappy} style={{ originX: '10px', originY: '10px' }} />
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Primary"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: dur.short * 0.7 } }}
            transition={{ duration: dur.short, ease: ease.out }}
            className="md:hidden absolute top-16 inset-x-0 bg-surface border-b border-line px-5 py-3 flex flex-col"
          >
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="h-12 flex items-center text-[17px] font-medium text-ink border-b border-line last:border-b-0">
                {t(n.key)}
              </Link>
            ))}
            <div className="py-2 sm:hidden"><LangToggle /></div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
