'use client';
import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Parcel, ContentLang } from '@/lib/sb4';
import { useT, contentLangNames } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { spring } from '@/lib/motion';
import { streamPost, type ApiFailure } from '@/lib/streamClient';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { toast } from '@/components/ui/Toast';
import { PaperSheet } from './PaperSheet';

export type LetterState = { text: string; source: string | null; streaming: boolean; done: boolean; error?: string };
const EMPTY: LetterState = { text: '', source: null, streaming: false, done: false };
const LANGS: ContentLang[] = ['en', 'es', 'vi', 'ko'];

export function LetterTab({ parcel, keepSpaces, lang, setLang, letters, setLetters, staffCopy, setStaffCopy }: {
  parcel: Parcel; keepSpaces: number;
  lang: ContentLang; setLang: (l: ContentLang) => void;
  letters: Partial<Record<ContentLang, LetterState>>; setLetters: Dispatch<SetStateAction<Partial<Record<ContentLang, LetterState>>>>;
  staffCopy: LetterState | null; setStaffCopy: Dispatch<SetStateAction<LetterState | null>>;
}) {
  const { t } = useT();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const night = theme === 'dark';
  const current = letters[lang] ?? EMPTY;
  const aborts = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    const map = aborts.current;
    return () => { Object.values(map).forEach((a) => a.abort()); };
  }, []);

  const draft = useCallback(async (target: 'main' | 'staff', l: ContentLang) => {
    const key = `${target}:${l}`;
    aborts.current[key]?.abort();
    const ctrl = new AbortController();
    aborts.current[key] = ctrl;
    const update = (patch: Partial<LetterState> | ((s: LetterState) => LetterState)) => {
      if (target === 'main') setLetters((s) => ({ ...s, [l]: typeof patch === 'function' ? patch(s[l] ?? EMPTY) : { ...(s[l] ?? EMPTY), ...patch } }));
      else setStaffCopy((s) => (typeof patch === 'function' ? patch(s ?? EMPTY) : { ...(s ?? EMPTY), ...patch }));
    };
    update({ text: '', streaming: true, done: false, error: undefined, source: null });
    try {
      const { source } = await streamPost('/api/pitch', { parcelId: parcel.id, lang: l, keepSpaces }, (_c, full) => update({ text: full }), ctrl.signal);
      update({ streaming: false, done: true, source });
    } catch (err) {
      if (ctrl.signal.aborted) return;
      const e = err as ApiFailure;
      update({ streaming: false, done: false, error: e?.message ?? t('common.error') });
      toast(t('common.error'), 'error');
    }
  }, [parcel.id, keepSpaces, setLetters, setStaffCopy, t]);

  const copy = async () => {
    if (!current.text) return;
    try {
      await navigator.clipboard.writeText(current.text);
      toast(t('pitch.copied'));
    } catch {
      toast(t('common.error'), 'error');
    }
  };

  const staffOn = staffCopy !== null;
  const toggleStaff = (on: boolean) => {
    if (on) { setStaffCopy(EMPTY); void draft('staff', 'en'); }
    else { aborts.current['staff:en']?.abort(); setStaffCopy(null); }
  };

  const flip = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { rotateY: -90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, exit: { rotateY: 90, opacity: 0 } };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-ink-2">{t('pitch.language')}</span>
          <Segmented size="sm" value={lang} onChange={setLang} ariaLabel={t('pitch.language')}
            options={LANGS.map((l) => ({ value: l, label: contentLangNames[l] }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => void draft('main', lang)} loading={current.streaming} data-testid="draft-letter">
            {current.done ? t('pitch.redraft') : t('pitch.draft')}
          </Button>
          <Button variant="secondary" onClick={copy} disabled={!current.text || current.streaming}>{t('pitch.copyLetter')}</Button>
        </div>
        <p className="text-helper text-ink-2">{t('pitch.nothingSent')}</p>
        {current.done && <p className="text-helper text-ink-2">{t('pitch.editHint')}</p>}
        {current.source === 'fallback' && <p className="text-helper text-signal-amber">{t('common.fallbackNote')}</p>}
        {current.error && <p className="text-helper text-signal-red">{current.error}</p>}

        {lang !== 'en' && (
          <div className="pt-4 border-t border-line flex flex-col gap-2">
            <Switch checked={staffOn} onChange={toggleStaff} label={t('pitch.englishCopy')} />
            <p className="text-small text-ink-2">{t('pitch.staffCopyHint')}</p>
            {staffCopy?.source === 'fallback' && <p className="text-small text-signal-amber">{t('common.fallbackNote')}</p>}
          </div>
        )}
      </div>

      <div className="lg:col-span-8 flex flex-col gap-10">
        <div style={{ perspective: 1400 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={lang}
              {...flip}
              transition={reduced ? { duration: 0 } : spring.settle}
              style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            >
              <PaperSheet
                id={`letter-${lang}`}
                lang={lang}
                text={current.text}
                streaming={current.streaming}
                done={current.done}
                night={night}
                placeholder={t('pitch.letterEmpty')}
                onChange={(text) => setLetters((s) => ({ ...s, [lang]: { ...(s[lang] ?? EMPTY), text } }))}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {lang !== 'en' && staffCopy && (
            <motion.div key="staff" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={spring.smooth} className="flex flex-col gap-3">
              <h2 className="text-[15px] font-medium text-ink-2 text-center" style={{ fontFamily: 'var(--font-sans)' }}>{t('pitch.englishCopy')}</h2>
              <PaperSheet
                id="letter-staff"
                lang="en"
                compact
                text={staffCopy.text}
                streaming={staffCopy.streaming}
                done={staffCopy.done}
                night={night}
                placeholder={t('pitch.letterEmpty')}
                onChange={(text) => setStaffCopy((s) => ({ ...(s ?? EMPTY), text }))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
