'use client';
/**
 * Guided tour overlay: a small step card bottom-right and a pine outline over the current target.
 * Never blocks the UI (pointer events only on the card). Mounted once in Providers.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useT } from '@/lib/i18n';
import { spring, dur, ease } from '@/lib/motion';
import { Button, ButtonLink } from '@/components/ui/Button';
import {
  TOUR_KEY, TOUR_STEPS, TOUR_TOTAL, TOUR_SELECTOR_POLL_MS, TOUR_SELECTOR_TIMEOUT_MS, JUDGE_GUIDE_ROUTE,
  readTour, goToStep, endTour, onRoute, stepRoute, type TourState,
} from '@/lib/tour';

type Rect = { x: number; y: number; w: number; h: number };
const PAD = 6;

const sameRect = (a: Rect | null, b: Rect | null) =>
  (!a && !b) || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5);

export function TourOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useT();
  const reduced = useReducedMotion();
  const [state, setState] = useState<TourState | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  // Persisted state → React state; follow writes from anywhere (startTour, other tabs).
  useEffect(() => {
    const sync = () => setState(readTour());
    sync();
    const onStore = (e: Event) => { if ((e as CustomEvent<{ key: string }>).detail?.key === TOUR_KEY) sync(); };
    window.addEventListener('keystone:store', onStore);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('keystone:store', onStore); window.removeEventListener('storage', sync); };
  }, []);

  const active = !!state?.active;
  const index = state?.step ?? 0;
  const finished = active && index >= TOUR_TOTAL;
  const step = active && !finished ? TOUR_STEPS[index] : null;
  const here = step ? onRoute(pathname, step.route) : false;

  // Resolve the target on this route: poll up to 3 s for the selector (pages hydrate and stream).
  useEffect(() => {
    targetRef.current = null;
    setRect(null);
    if (!step || !here) return;
    let cancelled = false;
    let scrolled = false;
    const started = performance.now();
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(step.selector);
      if (el) {
        targetRef.current = el;
        if (!scrolled) {
          scrolled = true;
          const r = el.getBoundingClientRect();
          const off = r.top < 80 || r.bottom > window.innerHeight - 160;
          if (off) el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        }
        return;
      }
      if (performance.now() - started < TOUR_SELECTOR_TIMEOUT_MS) window.setTimeout(tick, TOUR_SELECTOR_POLL_MS);
    };
    tick();
    return () => { cancelled = true; };
  }, [step, here, pathname, reduced]);

  // Measure on scroll/resize through one rAF, plus a slow heartbeat for layout animations.
  useEffect(() => {
    if (!step || !here) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = targetRef.current;
      if (!el || !el.isConnected) { setRect((r) => (r ? null : r)); return; }
      const b = el.getBoundingClientRect();
      const next: Rect = { x: b.left - PAD, y: b.top - PAD, w: b.width + PAD * 2, h: b.height + PAD * 2 };
      setRect((r) => (sameRect(r, next) ? r : next));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(measure); };
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    const beat = window.setInterval(schedule, 250);
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      window.clearInterval(beat);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [step, here]);

  const go = useCallback((to: number) => {
    const next = goToStep(to);
    setState(next);
    const route = stepRoute(next.step);
    if (next.step < TOUR_TOTAL && !onRoute(pathname, route)) router.push(route);
  }, [pathname, router]);

  const skip = useCallback(() => { endTour(); setState(null); }, []);

  // Esc skips; keyboard actions are instant (no animation needed).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') skip(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, skip]);

  if (!active || !state) return null;

  const cardMotion = {
    initial: reduced ? false : { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: dur.short * 0.7, ease: ease.out } },
    transition: { duration: dur.short, ease: ease.out },
  } as const;

  const cardClass = 'pointer-events-auto panel shadow-[var(--shadow-soft)] w-full sm:w-[340px] p-4';
  const showHighlight = !!step && here && !!rect;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none" aria-live="polite">
      {/* highlight: pine outline + soft glow over the target's rect */}
      <AnimatePresence>
        {showHighlight && rect && (
          <motion.div
            key="hl"
            data-testid="tour-highlight"
            layout
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: dur.short * 0.7 } }}
            transition={reduced ? { duration: 0 } : { ...spring.smooth, opacity: { duration: dur.short, ease: ease.out } }}
            className="fixed rounded-[10px] border-2 border-pine pointer-events-none"
            style={{
              left: rect.x, top: rect.y, width: rect.w, height: rect.h,
              boxShadow: '0 0 0 4px color-mix(in srgb, var(--pine) 18%, transparent), 0 0 28px color-mix(in srgb, var(--pine) 30%, transparent)',
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 flex justify-end">
        <AnimatePresence mode="wait" initial={false}>
          {finished ? (
            <motion.div key="done" {...cardMotion} className={cardClass} role="dialog" aria-label={t('tour.aria')} data-testid="tour-card" data-tour="done">
              <p className="text-[13px] leading-[18px] text-ink-2 tabular-nums">{t('tour.step', { n: TOUR_TOTAL, total: TOUR_TOTAL })}</p>
              <h2 className="font-sans text-[15px] leading-[22px] font-semibold text-ink mt-1 tracking-normal">{t('tour.done')}</h2>
              <p className="text-[15px] leading-[22px] text-ink-2 mt-1">{t('tour.doneBody')}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button type="button" onClick={skip} className="h-11 px-2 -ml-2 rounded-[8px] text-[15px] font-medium text-ink-2 hover:text-ink hover:bg-pine-soft transition-colors duration-[120ms]">{t('common.close')}</button>
                <ButtonLink href={JUDGE_GUIDE_ROUTE} onClick={skip} data-testid="tour-back-to-guide">{t('tour.backToGuide')}</ButtonLink>
              </div>
            </motion.div>
          ) : step && !here ? (
            <motion.div key="resume" {...cardMotion} className={`${cardClass} sm:w-[300px]`} role="dialog" aria-label={t('tour.aria')} data-testid="tour-card" data-tour="resume">
              <p className="text-[13px] leading-[18px] text-ink-2 tabular-nums">{t('tour.step', { n: step.n, total: TOUR_TOTAL })}</p>
              <p className="text-[15px] leading-[22px] font-semibold text-ink mt-1">{t(step.title)}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button type="button" onClick={skip} className="h-11 px-2 -ml-2 rounded-[8px] text-[15px] font-medium text-ink-2 hover:text-ink hover:bg-pine-soft transition-colors duration-[120ms]">{t('tour.skip')}</button>
                <Button onClick={() => router.push(step.route)} data-testid="tour-resume">{t('tour.resume')}</Button>
              </div>
            </motion.div>
          ) : step ? (
            <motion.div key={`step-${step.n}`} {...cardMotion} className={cardClass} role="dialog" aria-label={t('tour.aria')} data-testid="tour-card" data-tour={step.n}>
              <p className="text-[13px] leading-[18px] text-ink-2 tabular-nums">{t('tour.step', { n: step.n, total: TOUR_TOTAL })}</p>
              <h2 className="font-sans text-[15px] leading-[22px] font-semibold text-ink mt-1 tracking-normal">{t(step.title)}</h2>
              <p className="text-[15px] leading-[22px] text-ink-2 mt-1">{t(step.body)}</p>
              <div className="mt-4 flex items-center gap-2">
                <button type="button" onClick={skip} className="h-11 px-2 -ml-2 mr-auto rounded-[8px] text-[15px] font-medium text-ink-2 hover:text-ink hover:bg-pine-soft transition-colors duration-[120ms]" data-testid="tour-skip">{t('tour.skip')}</button>
                <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0} data-testid="tour-back">{t('common.back')}</Button>
                <Button onClick={() => go(index + 1)} data-testid="tour-next">{index + 1 >= TOUR_TOTAL ? t('tour.finish') : t('common.next')}</Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
