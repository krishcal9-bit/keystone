'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { useT } from '@/lib/i18n';
import { STAGES, type PipelineEntry, type Stage } from '@/lib/store';
import { isStalled } from '@/lib/pipeline';
import type { Parcel } from '@/lib/sb4';
import { spring, dur, ease } from '@/lib/motion';
import { Select } from '@/components/ui/Field';
import { Pill } from '@/components/ui/Pill';
import { toast } from '@/components/ui/Toast';

export type RowProps = {
  entry: PipelineEntry;
  parcel: Parcel;
  /** Index for the first-load stagger; null once the intro has played. */
  introIndex: number | null;
  now: number;
  onStage: (id: string, s: Stage) => void;
  onNote: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
};

export function relativeDays(iso: string, now: number) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((now - t) / 86_400_000));
}

export function PipelineRow({ entry, parcel, introIndex, now, onStage, onNote, onRemove }: RowProps) {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [note, setNote] = useState(entry.notes);
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setNote(entry.notes); }, [entry.notes]);
  useEffect(() => {
    const el = taRef.current; if (!el) return;
    el.style.height = '0px'; el.style.height = `${Math.max(44, el.scrollHeight)}px`;
  }, [note]);

  const days = relativeDays(entry.lastActivity, now);
  const when = days === 0 ? t('pipe.today') : days === 1 ? t('pipe.yesterday') : t('pipe.daysAgo', { n: days });
  const stalled = isStalled(entry, now);
  const homes = Number.isFinite(entry.homes) ? (entry.homes as number) : 0;
  const name = parcel.displayName.replace(/\s*\(sample\)\s*$/i, '');

  const commit = () => {
    if (note.trim() === entry.notes.trim()) return;
    onNote(entry.parcelId, note.trim());
    toast(t('pipe.noteSaved'));
  };

  const intro = introIndex != null && !reduced;
  return (
    <motion.li
      layout
      layoutId={`row-${entry.parcelId}`}
      initial={intro ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: dur.short * 0.7, ease: ease.out } }}
      transition={reduced ? { duration: 0 } : { ...spring.snappy, delay: intro ? Math.min(introIndex, 7) * 0.02 : 0 }}
      className="grid gap-x-4 gap-y-2 items-start py-3 border-b border-line last:border-b-0 grid-cols-[minmax(0,1fr)_44px] md:grid-cols-[minmax(0,1.8fr)_56px_168px_132px_minmax(0,1.2fr)_44px]"
      data-stalled={stalled || undefined}
    >
      {/* site */}
      <div className="min-w-0 md:pt-2">
        <Link href={`/sites/${parcel.id}`} className="block text-[16px] leading-[22px] font-medium text-ink line-clamp-2 hover:text-pine transition-colors duration-[120ms]" title={parcel.displayName}>
          {name}
        </Link>
        <div className="text-[13px] leading-[18px] text-ink-2 truncate">
          {parcel.city}
          <span className="md:hidden tabular-nums"> · {homes} {t('common.homes')}</span>
        </div>
      </div>
      {/* remove (mobile position: top-right) */}
      <button
        type="button"
        onClick={() => onRemove(entry.parcelId)}
        aria-label={t('pipe.removeFor', { site: name })}
        title={t('pipe.remove')}
        className="md:order-last w-11 h-11 inline-flex items-center justify-center rounded-[8px] text-ink-2 hover:text-signal-red hover:bg-pine-soft transition-colors duration-[120ms]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      {/* homes */}
      <div className="hidden md:block pt-2 text-[16px] leading-[22px] tabular-nums text-ink text-right pr-1">{homes}</div>
      {/* stage */}
      <div className="col-span-2 md:col-span-1">
        <Select value={entry.stage} aria-label={t('pipe.moveTo', { site: name })} onChange={(e) => onStage(entry.parcelId, e.target.value as Stage)} className="text-[14px] h-11">
          {STAGES.map((s) => <option key={s} value={s}>{t(`stage.${s}` as 'stage.identified')}</option>)}
        </Select>
      </div>
      {/* last activity */}
      <div className="col-span-2 md:col-span-1 flex md:flex-col flex-wrap items-center md:items-start gap-x-3 gap-y-1 md:pt-2 text-[14px] leading-[20px] text-ink-2">
        <span className="tabular-nums" title={new Date(entry.lastActivity).toLocaleString()}>{when}</span>
        {stalled && <span title={t('pipe.stalledHelp')}><Pill tone="amber" className="whitespace-nowrap">{t('pipe.stalled')}</Pill></span>}
      </div>
      {/* notes */}
      <div className="col-span-2 md:col-span-1 min-w-0">
        <textarea
          ref={taRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).blur(); }}
          placeholder={t('pipe.addNote')}
          aria-label={t('pipe.notesFor', { site: name })}
          rows={1}
          className="w-full min-h-11 px-3 py-[10px] rounded-[8px] bg-transparent border border-transparent hover:border-line focus:border-line focus:bg-surface text-[14px] leading-6 text-ink placeholder:text-ink-2/70 resize-none transition-colors duration-[120ms] outline-none focus-visible:outline-2 focus-visible:outline-pine"
        />
      </div>
    </motion.li>
  );
}
