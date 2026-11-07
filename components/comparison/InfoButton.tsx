'use client';
/**
 * The small "i" beside every comparison number. 44 px hit area, 16 px glyph. Opens a popover anchored at the
 * button (origin at the trigger, 160 ms, solid paper panel, hairline) that shows the value, exactly how it is
 * calculated, the inputs, and the source with its estimate / live / measured label.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useT, type DictKey } from '@/lib/i18n';
import { ease } from '@/lib/motion';
import { Pill } from '@/components/ui/Pill';
import { fmtNum, fmtUsd, type Figure, type FigureTag } from '@/lib/comparison';

const TAG_KEY: Record<FigureTag, DictKey> = { estimate: 'cmp.tag.estimate', live: 'cmp.tag.live', measured: 'cmp.tag.measured', sb4: 'cmp.tag.sb4', default: 'cmp.tag.default', derived: 'cmp.tag.derived' };
const TAG_TONE: Record<FigureTag, 'neutral' | 'pine' | 'brass' | 'amber'> = { estimate: 'amber', live: 'pine', measured: 'pine', sb4: 'brass', default: 'neutral', derived: 'neutral' };

/** The figure's value as text, in its unit. */
export function figureText(f: Figure, t: (k: DictKey, v?: Record<string, string | number>) => string, locale: string) {
  switch (f.unit) {
    case 'money': return fmtUsd(f.value, locale);
    case 'days': return `${fmtNum(f.value, locale)} ${t('cmp.unit.days')}`;
    case 'minutes': return `${fmtNum(f.value, locale)} ${t('cmp.unit.min')}`;
    case 'factor': return `${fmtNum(f.value, locale)}×`;
    default: return fmtNum(f.value, locale);
  }
}

const POP_W = 300, GAP = 6, MARGIN = 12;

export function InfoButton({ figure, title, className = '' }: { figure: Figure; title: string; className?: string }) {
  const { t, lang } = useT();
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  const reduced = useReducedMotion();
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean; originX: number } | null>(null);

  // Place the panel against the button: below by default, above when the viewport runs out; origin at the trigger.
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(POP_W, vw - MARGIN * 2);
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(MARGIN, Math.min(vw - w - MARGIN, left));
    const up = vh - r.bottom < 300 && r.top > 300;
    const top = up ? r.top - GAP : r.bottom + GAP;
    setPos({ left, top, up, originX: r.left + r.width / 2 - left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node;
      if (panel.current?.contains(el) || btn.current?.contains(el)) return;
      setOpen(false);
    };
    const onMove = () => setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    const f = setTimeout(() => panel.current?.focus(), 30);
    return () => { clearTimeout(f); window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown, true); window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove); };
  }, [open]);

  const w = typeof window !== 'undefined' ? Math.min(POP_W, window.innerWidth - MARGIN * 2) : POP_W;
  return (
    <>
      <button
        ref={btn}
        type="button"
        data-testid="info-popover-button"
        aria-label={`${t('cmp.info')}: ${title}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`relative inline-flex items-center justify-center w-11 h-11 -m-[14px] rounded-full text-current pressable ${className}`}
      >
        <span className={`w-4 h-4 rounded-full border inline-flex items-center justify-center text-[10px] leading-none font-semibold transition-colors duration-[120ms] ${open ? 'bg-pine text-paper border-pine' : 'border-current opacity-70'}`} aria-hidden>i</span>
      </button>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={panel}
              id={id}
              role="dialog"
              aria-label={title}
              tabIndex={-1}
              data-testid="info-popover"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.97, transition: { duration: 0.11, ease: ease.out } }}
              transition={{ duration: 0.16, ease: ease.out }}
              style={{ position: 'fixed', left: pos.left, top: pos.top, width: w, zIndex: 90, transformOrigin: `${pos.originX}px ${pos.up ? '100%' : '0%'}`, translate: pos.up ? '0 -100%' : undefined, background: 'var(--surface)' }}
              className="rounded-[14px] border border-line p-4 text-ink shadow-[0_1px_2px_rgba(24,36,32,0.06),0_12px_32px_rgba(24,36,32,0.10)] outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] leading-[18px] text-ink-2">{title}</p>
                  <p className="big-number text-ink mt-1" style={{ fontSize: 28 }}>{figureText(figure, t, locale)}</p>
                </div>
                <Pill tone={TAG_TONE[figure.tag]} className="shrink-0 mt-0.5">{t(TAG_KEY[figure.tag])}</Pill>
              </div>
              <p className="mt-3 text-[13px] leading-[18px] font-semibold text-ink">{t('cmp.howCalculated')}</p>
              <p className="mt-1 text-[14px] leading-5 text-ink" style={{ textWrap: 'pretty' }}>{t(figure.formula, figure.vars)}</p>
              <p className="mt-3 text-[13px] leading-[18px] font-semibold text-ink">{t('cmp.inputs')}</p>
              <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-[13px] leading-[18px]">
                {figure.inputs.map((inp, i) => (
                  <div key={i} className="contents">
                    <dt className="text-ink-2">{t(inp.label)}</dt>
                    <dd className="m-0 tabular-nums text-ink text-right">{inp.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 pt-3 border-t border-line text-[12px] leading-4 text-ink-2" style={{ textWrap: 'pretty' }}><span className="font-semibold">{t('cmp.source')}:</span> {figure.source}</p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
