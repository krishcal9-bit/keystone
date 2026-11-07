'use client';
import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import type { Parcel } from '@/lib/sb4';
import type { Objection } from '@/lib/pitchFallback';
import { useT } from '@/lib/i18n';
import { dur, ease, stagger } from '@/lib/motion';
import { postJson, type ApiFailure } from '@/lib/streamClient';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { AutoTextarea } from './AutoTextarea';

export type ObjectionsState = { items: Objection[] | null; source: string | null; loading: boolean; error?: string };

export function ObjectionsTab({ parcel, keepSpaces, state, setState }: {
  parcel: Parcel; keepSpaces: number; state: ObjectionsState; setState: Dispatch<SetStateAction<ObjectionsState>>;
}) {
  const { t } = useT();

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));
    try {
      const { data, source } = await postJson<{ objections: Objection[] }>('/api/objections', { parcelId: parcel.id, keepSpaces });
      setState({ items: data.objections, source, loading: false });
    } catch (err) {
      const e = err as ApiFailure;
      setState((s) => ({ ...s, loading: false, error: e?.message ?? t('common.error') }));
      toast(t('common.error'), 'error');
    }
  };

  const edit = (id: string, answer: string) =>
    setState((s) => ({ ...s, items: s.items?.map((o) => (o.id === id ? { ...o, answer } : o)) ?? null }));

  const copyAll = async () => {
    if (!state.items) return;
    const text = state.items.map((o) => `${o.question}\n${o.answer}`).join('\n\n');
    try { await navigator.clipboard.writeText(text); toast(t('pitch.copiedAll')); } catch { toast(t('common.error'), 'error'); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4 flex flex-col gap-5">
        <p className="text-ink-2 text-[16px] leading-6">{t('pitch.objectionsHelp')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={load} loading={state.loading} data-testid="prepare-qa">{t('pitch.loadObjections')}</Button>
          <Button variant="secondary" onClick={copyAll} disabled={!state.items}>{t('pitch.copyAll')}</Button>
        </div>
        <p className="text-helper text-ink-2">{t('pitch.nothingSent')}</p>
        {state.source === 'fallback' && <p className="text-helper text-signal-amber">{t('common.fallbackNote')}</p>}
        {state.error && <p className="text-helper text-signal-red">{state.error}</p>}
      </div>

      <div className="lg:col-span-8">
        {state.loading && !state.items && (
          <div className="flex flex-col divide-y divide-line border-y border-line" aria-busy>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="py-5 flex flex-col gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton lines={3} />
              </div>
            ))}
          </div>
        )}
        {state.items && (
          <ol className="flex flex-col divide-y divide-line border-y border-line" data-testid="objections">
            {state.items.map((o, i) => (
              <motion.li
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: dur.medium, ease: ease.out, delay: Math.min(i, 8) * stagger }}
                className="py-5"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-[18px] leading-7 font-medium" style={{ fontFamily: 'var(--font-sans)', letterSpacing: 0 }}>{o.question}</h3>
                  <AutoTextarea
                    value={o.answer}
                    onChange={(e) => edit(o.id, e.target.value)}
                    aria-label={o.question}
                    className="text-[16px] leading-6 text-ink-2 rounded-[8px] -mx-2 px-2 py-1 hover:bg-pine-soft/50 focus:bg-surface focus:text-ink transition-colors duration-[120ms]"
                  />
                </div>
              </motion.li>
            ))}
          </ol>
        )}
        {!state.items && !state.loading && (
          <div className="border border-dashed border-line rounded-[14px] p-10 text-center text-ink-2 text-helper">{t('pitch.objectionsEmpty')}</div>
        )}
      </div>
    </div>
  );
}
