'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useT } from '@/lib/i18n';
import { SB4_FACTS } from '@/lib/sb4Facts';
import { streamPost } from '@/lib/streamClient';
import { spring, dur, ease, stagger } from '@/lib/motion';
import { PageShell } from '@/components/layout/PageShell';
import { Button, Spinner } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { StudyBackdrop } from '@/components/scenes/StudyBackdrop';
import { Markdownish } from '@/components/pipeline/Markdownish';
import { AboutSb4, factLabel } from './AboutSb4';

type Turn = { id: number; question: string; answer: string; facts: string[]; status: 'streaming' | 'done' | 'error'; source?: string };

const FACTS_RE = /\n?\s*FACTS?\s*:\s*([A-Z]\d+(?:\s*,\s*[A-Z]\d+)*)\.?\s*$/i;
const PARTIAL_RE = /\n\s*F(A(C(T(S?\s*:?.*)?)?)?)?$/;

/** Splits the model's final "FACTS: F1, F6" line from the prose. While streaming, a half-typed FACTS line is hidden too. */
export function splitFacts(full: string, streaming: boolean): { body: string; facts: string[] } {
  const m = FACTS_RE.exec(full);
  if (m) {
    const known = new Set<string>(SB4_FACTS.map((f) => f.id));
    const facts = m[1].split(',').map((s) => s.trim().toUpperCase()).filter((id, i, arr) => known.has(id) && arr.indexOf(id) === i);
    return { body: full.slice(0, m.index).trimEnd(), facts };
  }
  if (streaming) return { body: full.replace(PARTIAL_RE, '').trimEnd(), facts: [] };
  return { body: full.trim(), facts: [] };
}

const QUESTION_KEYS = ['ask.q1', 'ask.q2', 'ask.q3', 'ask.q4', 'ask.q5', 'ask.q6'] as const;
const MAX_CHARS = 600;

export function AskView() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const busy = turns.some((x) => x.status === 'streaming');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async (question: string) => {
    const q = question.trim().slice(0, MAX_CHARS);
    if (!q || busy) return;
    const id = ++counter.current;
    const history = turns.filter((x) => x.status === 'done').slice(-4).flatMap((x) => [{ role: 'user' as const, text: x.question }, { role: 'assistant' as const, text: x.answer.slice(0, 2000) || '…' }]);
    setTurns((s) => [...s, { id, question: q, answer: '', facts: [], status: 'streaming' }]);
    setInput('');
    const ac = new AbortController();
    abortRef.current = ac;
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'end' }));
    try {
      const res = await streamPost('/api/ask', { question: q, history }, (_c, full) => {
        const { body } = splitFacts(full, true);
        setTurns((s) => s.map((x) => (x.id === id ? { ...x, answer: body } : x)));
      }, ac.signal);
      const { body, facts } = splitFacts(res.text, false);
      setTurns((s) => s.map((x) => (x.id === id ? { ...x, answer: body, facts, status: 'done', source: res.source } : x)));
    } catch (err) {
      if (ac.signal.aborted) return;
      console.warn('[ask]', err);
      setTurns((s) => s.filter((x) => x.id !== id));
      setInput(q);
      toast(t('ask.failed'), 'error');
    }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); void ask(input); };
  const onFact = (id: string) => { setAboutOpen(true); setHighlight(id); };

  const tr = reduced ? { duration: 0 } : spring.smooth;

  return (
    <PageShell title={t('ask.title')} lane={t('lane.ask')} subtitle={t('ask.subtitle')} backdrop={<StudyBackdrop />} width="narrow" sample={false}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0">
          {/* Suggested questions */}
          <section aria-label={t('ask.suggested')}>
            <p className="text-[13px] leading-[18px] text-ink-2 mb-2">{turns.length ? t('ask.suggested') : t('ask.hint')}</p>
            <ul className="flex flex-wrap gap-2">
              {QUESTION_KEYS.map((k, i) => (
                <motion.li key={k} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.medium, ease: ease.out, delay: i * stagger }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void ask(t(k))}
                    className="pressable min-h-11 px-3.5 py-2 rounded-[8px] bg-surface border border-line text-[15px] leading-[22px] text-left text-ink hover:border-pine hover:text-pine transition-colors duration-[120ms] disabled:opacity-50"
                  >
                    {t(k)}
                  </button>
                </motion.li>
              ))}
            </ul>
          </section>

          {/* Conversation */}
          <LayoutGroup id="ask-thread">
            <motion.ol layout transition={tr} className="mt-6 flex flex-col gap-6" aria-live="polite">
              <AnimatePresence initial={false}>
                {turns.map((turn) => (
                  <motion.li key={turn.id} layout transition={tr} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: dur.micro } }} className="flex flex-col gap-3">
                    <motion.div layout="position" className="self-end max-w-[85%] rounded-[14px] rounded-br-[4px] bg-pine-soft px-4 py-2.5 text-[16px] leading-6 text-ink">
                      <span className="sr-only">{t('ask.you')}: </span>{turn.question}
                    </motion.div>
                    <motion.div layout className="panel px-5 py-4 max-w-[92%]">
                      <div className="flex items-center gap-2 text-[13px] leading-[18px] text-ink-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-brass" aria-hidden />
                        <span className="font-medium">{t('ask.keystone')}</span>
                        {turn.status === 'streaming' && !turn.answer && <Spinner size={12} className="text-ink-2" />}
                      </div>
                      {turn.answer ? <Markdownish text={turn.answer} /> : <span className="inline-block w-[2px] h-[18px] bg-pine animate-pulse" aria-hidden />}
                      {turn.status === 'streaming' && turn.answer && <span className="inline-block w-[2px] h-[18px] align-text-bottom bg-pine ml-0.5 animate-pulse" aria-hidden />}
                      {turn.status === 'done' && turn.facts.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-line">
                          <span className="text-[13px] leading-[18px] text-ink-2 mr-2">{t('ask.sources')}</span>
                          <ul className="inline-flex flex-wrap gap-1.5 align-middle">
                            {turn.facts.map((id, i) => {
                              const fact = SB4_FACTS.find((f) => f.id === id);
                              return (
                                <motion.li key={id} initial={reduced ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring.snappy, delay: i * stagger }}>
                                  <button
                                    type="button"
                                    onClick={() => onFact(id)}
                                    title={fact?.text}
                                    className="inline-flex items-center h-7 px-2.5 rounded-full border border-transparent bg-[color-mix(in_srgb,var(--brass)_16%,transparent)] text-brass text-[13px] font-medium leading-none hover:border-brass transition-colors duration-[120ms]"
                                  >
                                    {factLabel(t, id)}
                                  </button>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {turn.status === 'done' && turn.source && turn.source !== 'claude' && <p className="mt-3 text-[13px] leading-[18px] text-ink-2">{t('common.fallbackNote')}</p>}
                    </motion.div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ol>
          </LayoutGroup>
          <div ref={endRef} />

          {/* Input */}
          <form onSubmit={onSubmit} className="sticky bottom-4 mt-6 panel p-2 flex items-center gap-2 shadow-[var(--shadow-soft)]">
            <label htmlFor="ask-input" className="sr-only">{t('ask.placeholder')}</label>
            <input
              id="ask-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              placeholder={t('ask.placeholder')}
              maxLength={MAX_CHARS}
              autoComplete="off"
              className="flex-1 min-w-0 h-11 px-3 rounded-[8px] bg-transparent text-[16px] text-ink placeholder:text-ink-2/70 outline-none focus-visible:outline-2 focus-visible:outline-pine"
            />
            {input.length > MAX_CHARS - 80 && <span className="text-[13px] tabular-nums text-ink-2 hidden sm:inline">{input.length}/{MAX_CHARS}</span>}
            <Button type="submit" disabled={!input.trim() || busy} loading={busy}>{t('ask.send')}</Button>
          </form>
          <p className="mt-3 text-[13px] leading-[18px] text-ink-2 text-center">{t('common.notLegal')}</p>
        </div>

        <div className="lg:sticky lg:top-24">
          <AboutSb4 open={aboutOpen} onToggle={() => setAboutOpen((o) => !o)} highlight={highlight} />
        </div>
      </div>
    </PageShell>
  );
}
