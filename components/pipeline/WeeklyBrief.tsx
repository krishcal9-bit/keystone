'use client';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useT } from '@/lib/i18n';
import type { PipelineEntry } from '@/lib/store';
import { streamPost } from '@/lib/streamClient';
import { spring, dur, ease } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { Markdownish } from './Markdownish';

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export function WeeklyBrief({ entries }: { entries: PipelineEntry[] }) {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<Status>('idle');
  const [text, setText] = useState('');
  const [source, setSource] = useState<string>('');
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus('loading'); setText(''); setSource(''); setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 1000);
    try {
      const res = await streamPost('/api/weekly', { entries }, (_c, full) => {
        clearTimeout(slowTimer);
        setStatus('streaming');
        setText(full);
      }, ac.signal);
      setSource(res.source);
      setStatus('done');
    } catch (err) {
      if (ac.signal.aborted) return;
      console.warn('[weekly]', err);
      setStatus('error');
      toast(t('pipe.weeklyFailed'), 'error');
    } finally {
      clearTimeout(slowTimer);
    }
  };

  const busy = status === 'loading' || status === 'streaming';
  const tr = reduced ? { duration: 0 } : spring.smooth;

  return (
    <motion.section layout transition={tr} className="panel p-5 md:p-6" aria-labelledby="weekly-title">
      <motion.div layout="position" className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="weekly-title" className="font-sans text-[18px] leading-7 font-semibold tracking-normal text-ink">{t('pipe.weekly')}</h2>
          <p className="text-[15px] leading-[22px] text-ink-2 mt-0.5">{t('pipe.weeklyHelp')}</p>
        </div>
        <Button variant={status === 'done' ? 'secondary' : 'primary'} size="md" onClick={run} loading={status === 'loading'} disabled={busy || entries.length === 0} className="shrink-0">
          {status === 'error' ? t('common.retry') : t('pipe.weekly')}
        </Button>
      </motion.div>
      <AnimatePresence initial={false} mode="popLayout">
        {status === 'loading' && slow && (
          <motion.div key="skeleton" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: dur.micro } }} transition={{ duration: dur.short, ease: ease.out }} className="mt-5">
            <Skeleton lines={6} />
          </motion.div>
        )}
        {text && (
          <motion.div key="text" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: dur.micro } }} transition={{ duration: dur.short, ease: ease.out }} className="mt-5 pt-5 border-t border-line">
            <Markdownish text={text} />
            {status === 'streaming' && <span className="inline-block w-[2px] h-[18px] align-text-bottom bg-pine ml-0.5 animate-pulse" aria-hidden />}
            {status === 'done' && source !== 'claude' && <p className="mt-4 text-[13px] leading-[18px] text-ink-2">{t('common.fallbackNote')}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
