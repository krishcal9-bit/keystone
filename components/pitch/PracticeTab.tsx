'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Parcel } from '@/lib/sb4';
import { useT } from '@/lib/i18n';
import { rise, spring } from '@/lib/motion';
import { read, write, storeKeys, type PracticeTranscript } from '@/lib/store';
import { postJson, type ApiFailure } from '@/lib/streamClient';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { toast } from '@/components/ui/Toast';
import { AutoTextarea } from './AutoTextarea';
import { TypingDots } from './TypingDots';

const MAX_TURNS = 4;
type Turn = PracticeTranscript['turns'][number];
type Session = { createdAt: string; turns: Turn[]; feedback?: string; source?: string };

function saveSession(parcelId: string, s: Session) {
  const all = read<PracticeTranscript[]>(storeKeys.transcripts, []);
  const entry: PracticeTranscript = { parcelId, createdAt: s.createdAt, turns: s.turns, feedback: s.feedback };
  const idx = all.findIndex((x) => x.parcelId === parcelId && x.createdAt === s.createdAt);
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  write(storeKeys.transcripts, all.slice(-50));
}

export function PracticeTab({ parcel, keepSpaces }: { parcel: Parcel; keepSpaces: number }) {
  const { t } = useT();
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  // Resume the most recent transcript for this parcel (saved locally, never sent anywhere).
  useEffect(() => {
    const all = read<PracticeTranscript[]>(storeKeys.transcripts, []);
    const last = all.filter((x) => x.parcelId === parcel.id).at(-1);
    if (last && last.turns.length) setSession({ createdAt: last.createdAt, turns: last.turns, feedback: last.feedback });
    return () => abort.current?.abort();
  }, [parcel.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [session?.turns.length, session?.feedback, loading]);

  const staffCount = session?.turns.filter((x) => x.role === 'staff').length ?? 0;
  const finished = !!session?.feedback;
  const turnNumber = Math.min(staffCount + 1, MAX_TURNS);

  const call = useCallback(async (s: Session, mode: 'turn' | 'feedback') => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const { data, source } = await postJson<{ text: string }>('/api/practice', { parcelId: parcel.id, keepSpaces, transcript: s.turns, mode }, ctrl.signal);
      const next: Session = mode === 'turn'
        ? { ...s, source, turns: [...s.turns, { role: 'board', text: data.text }] }
        : { ...s, source, feedback: data.text };
      setSession(next);
      saveSession(parcel.id, next);
      if (mode === 'feedback') toast(t('pitch.saved'));
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const e = err as ApiFailure;
      setError(e?.message ?? t('common.error'));
      toast(t('common.error'), 'error');
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [parcel.id, keepSpaces, t]);

  const start = () => {
    const s: Session = { createdAt: new Date().toISOString(), turns: [] };
    setSession(s);
    setDraft('');
    void call(s, 'turn');
  };

  const send = () => {
    if (!session || loading || finished) return;
    const text = draft.trim();
    if (!text) return;
    const s: Session = { ...session, turns: [...session.turns, { role: 'staff', text }] };
    setSession(s);
    saveSession(parcel.id, s);
    setDraft('');
    const staff = s.turns.filter((x) => x.role === 'staff').length;
    void call(s, staff >= MAX_TURNS ? 'feedback' : 'turn');
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4 flex flex-col gap-5">
        <p className="text-ink-2 text-[16px] leading-6">{t('pitch.practiceHelp')}</p>
        <div className="grid grid-cols-2 gap-3">
          {!session ? (
            <Button onClick={start} loading={loading} data-testid="start-practice">{t('pitch.start')}</Button>
          ) : (
            <Button variant="secondary" onClick={start} disabled={loading}>{t('pitch.restart')}</Button>
          )}
          {session && (
            <div className="inline-flex items-center justify-center">
              <Pill tone={finished ? 'brass' : 'pine'}>{finished ? t('pitch.practiceDone') : t('pitch.turn', { n: turnNumber })}</Pill>
            </div>
          )}
        </div>
        <p className="text-helper text-ink-2">{t('pitch.transcriptLocal')}</p>
        {session?.source === 'fallback' && <p className="text-helper text-signal-amber">{t('common.fallbackNote')}</p>}
        {error && <p className="text-helper text-signal-red">{error}</p>}
      </div>

      <div className="lg:col-span-8 flex flex-col gap-4">
        {!session ? (
          <div className="border border-dashed border-line rounded-[14px] p-10 text-center text-ink-2 text-helper">{t('pitch.practiceEmpty')}</div>
        ) : (
          <div className="panel p-4 md:p-6 flex flex-col gap-4" data-testid="practice-chat">
            <ol className="flex flex-col gap-4" aria-live="polite">
              <AnimatePresence initial={false}>
                {session.turns.map((turn, i) => (
                  <motion.li key={`${i}-${turn.role}`} {...rise} layout className={`flex flex-col gap-1 max-w-[88%] ${turn.role === 'staff' ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-small text-ink-2 px-1">{turn.role === 'staff' ? t('pitch.you') : t('pitch.boardMember')}</span>
                    <div className={`rounded-[14px] px-4 py-3 text-[16px] leading-6 whitespace-pre-wrap ${turn.role === 'staff' ? 'bg-pine-soft text-ink rounded-br-[6px]' : 'bg-paper border border-line text-ink rounded-bl-[6px]'}`}>
                      {turn.text}
                    </div>
                  </motion.li>
                ))}
                {loading && (
                  <motion.li key="typing" {...rise} layout className="self-start flex flex-col gap-1">
                    <span className="text-small text-ink-2 px-1">{t('pitch.boardMember')}</span>
                    <div className="rounded-[14px] rounded-bl-[6px] bg-paper border border-line px-3 py-2">
                      <TypingDots label={t('pitch.thinking')} />
                    </div>
                  </motion.li>
                )}
                {session.feedback && (
                  <motion.li key="feedback" {...rise} layout className="mt-2 border-l-2 border-brass pl-4 py-1 flex flex-col gap-2">
                    <span className="text-small font-medium text-brass">{t('pitch.feedback')}</span>
                    <p className="text-[16px] leading-6 whitespace-pre-wrap">{session.feedback}</p>
                  </motion.li>
                )}
              </AnimatePresence>
            </ol>
            <div ref={endRef} />

            {!finished && (
              <motion.div layout transition={spring.smooth} className="border-t border-line pt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-ink-2">{t('pitch.yourAnswer')}</span>
                  <AutoTextarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKey}
                    disabled={loading || session.turns.length === 0}
                    placeholder={t('pitch.answerPlaceholder')}
                    className="min-h-[88px] rounded-[8px] border border-line bg-surface px-3 py-2.5 text-[16px] leading-6 hover:border-ink-2 focus:border-pine transition-colors duration-[120ms] disabled:opacity-50"
                    data-testid="practice-input"
                  />
                </label>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-small text-ink-2">{t('pitch.sendHint')}</span>
                  <Button onClick={send} disabled={loading || !draft.trim() || session.turns.length === 0} data-testid="practice-send">{t('pitch.send')}</Button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
