'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ExplainerPhase } from '@/components/explainer/useExplainer';
import { ease, dur, spring } from '@/lib/motion';
import { useT } from '@/lib/i18n';

export type SectionText = { kicker?: string; title: string; body?: string; actions?: ReactNode };

/**
 * One full-viewport section: scene (full-bleed, layered), text on a soft scrim, down-arrow cue,
 * Replay button when the scene's explainer is done. Layers shift with `--shift` for the camera-move transition.
 */
export function Section({ index, active, shift, text, children, onNext, isLast, phase, onReplay, align = 'left', textWidth = 'md', id, cursor = true, counter }: {
  index: number; active: boolean; shift: number; text?: SectionText; children: ReactNode; onNext: () => void; isLast?: boolean;
  phase?: ExplainerPhase; onReplay?: () => void; align?: 'left' | 'center' | 'right'; textWidth?: 'md' | 'lg'; id: string; cursor?: boolean; counter?: ReactNode;
}) {
  const { t } = useT();
  const ref = useRef<HTMLElement>(null);
  const [px, setPx] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!active || !cursor) { setPx({ x: 0, y: 0 }); return; }
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => { const w = window.innerWidth, h = window.innerHeight; setPx({ x: ((e.clientX / w) - 0.5) * 16, y: ((e.clientY / h) - 0.5) * 16 }); };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [active, cursor]);

  const textCol = align === 'center' ? 'items-center text-center mx-auto' : align === 'right' ? 'ml-auto' : '';
  return (
    <section
      ref={ref}
      id={id}
      data-section={index}
      data-active={active}
      data-ambient={active ? 'on' : 'off'}
      aria-label={text?.title}
      className="relative h-svh w-full overflow-hidden snap-start"
      style={{ ['--shift' as string]: `${shift}px`, ['--px' as string]: `${px.x}px`, ['--py' as string]: `${px.y}px` }}
    >
      <div className="absolute inset-0">{children}</div>
      {text && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={`mx-auto max-w-[1440px] h-full px-5 md:px-10 lg:px-20 flex ${align === 'center' ? 'items-start pt-[112px] lg:pt-[128px]' : 'items-start pt-[96px] lg:pt-[120px]'}`}>
            <motion.div
              className={`pointer-events-auto relative isolate ${textWidth === 'lg' ? 'max-w-[760px]' : 'max-w-[560px]'} flex flex-col ${textCol}`}
              initial={false}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0.0, y: 10 }}
              transition={{ duration: dur.long, ease: ease.out, delay: active ? 0.35 : 0 }}
            >
              <div className="absolute -inset-6 rounded-[20px] -z-[1]" style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} aria-hidden />
              {text.kicker && <p className="text-[15px] font-semibold text-pine mb-3">{text.kicker}</p>}
              <h2 className={`${index === 0 ? 'headline' : 'headline-md'} text-ink`}>
                <SplitLines text={text.title} active={active} />
              </h2>
              {text.body && <p className="mt-5 text-[17px] md:text-[18px] leading-7 text-ink-2 max-w-[52ch]">{text.body}</p>}
              {text.actions && <div className="mt-7 w-full max-w-[420px]">{text.actions}</div>}
              {counter && <div className="mt-6">{counter}</div>}
            </motion.div>
          </div>
        </div>
      )}
      {/* down / up arrow cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[5]">
        <AnimatePresence>
          {phase === 'done' && active && !isLast && (
            <motion.span key="next" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: dur.short, ease: ease.out }} className="text-[13px] font-medium text-ink-2 px-2 py-0.5 rounded-full bg-[var(--scrim)]">
              {t('common.next')}
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={onNext}
          aria-label={isLast ? t('land.backToTop') : t('land.nextSection')}
          className="w-11 h-11 rounded-full border-2 border-pine bg-[var(--scrim)] text-pine flex items-center justify-center hover:bg-pine-soft transition-colors duration-[120ms]"
          style={{ animation: 'ks-bob 2.5s ease-in-out infinite' }}
          data-testid={`section-arrow-${index}`}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isLast ? 'rotate(180deg)' : undefined }} aria-hidden>
            <path d="M5 8l5 5 5-5" />
          </svg>
        </button>
      </div>
      <AnimatePresence>
        {phase === 'done' && active && onReplay && (
          <motion.button key="replay" type="button" onClick={onReplay} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring.snappy}
            className="absolute bottom-6 right-5 md:right-10 lg:right-20 z-[5] h-10 px-3 rounded-[8px] bg-[var(--scrim)] border border-line text-[13px] font-medium text-ink hover:bg-pine-soft" data-testid={`replay-${index}`}>
            {t('common.replay')}
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Headline lines rise from masks, 70 ms apart. */
export function SplitLines({ text, active, stagger = 0.07 }: { text: string; active: boolean; stagger?: number }) {
  const words = text.split(' ');
  // group into lines of ~4 words for the mask reveal (CSS wraps within; masks per chunk)
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 3) chunks.push(words.slice(i, i + 3).join(' '));
  return (
    <>
      {chunks.map((c, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <motion.span className="inline-block" initial={false} animate={active ? { y: 0, opacity: 1 } : { y: '110%', opacity: 0 }} transition={{ duration: dur.long, ease: ease.out, delay: active ? 0.45 + i * stagger : 0 }}>
            {c}{i < chunks.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </>
  );
}
