'use client';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Parcel, ContentLang } from '@/lib/sb4';
import { recommendedScenario, impact } from '@/lib/sb4';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { rise } from '@/lib/motion';
import { PageShell } from '@/components/layout/PageShell';
import { Segmented } from '@/components/ui/Segmented';
import { DeskBackdrop } from '@/components/scenes/DeskBackdrop';
import { LetterTab, type LetterState } from './LetterTab';
import { OnePagerTab } from './OnePagerTab';
import { ObjectionsTab, type ObjectionsState } from './ObjectionsTab';
import { PracticeTab } from './PracticeTab';

type Tab = 'letter' | 'onePager' | 'objections' | 'practice';

export function PitchKit({ parcel, initialKeepSpaces }: { parcel: Parcel; initialKeepSpaces: number }) {
  const { t } = useT();
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>('letter');
  const [keepSpaces] = useState(initialKeepSpaces);
  // Shared state lives here so switching tabs never loses a drafted letter or a half-finished practice run.
  const [lang, setLang] = useState<ContentLang>(parcel.congregationLanguage);
  const [letters, setLetters] = useState<Partial<Record<ContentLang, LetterState>>>({});
  const [staffCopy, setStaffCopy] = useState<LetterState | null>(null);
  const [objections, setObjections] = useState<ObjectionsState>({ items: null, source: null, loading: false });

  const scenario = useMemo(() => recommendedScenario(parcel, keepSpaces), [parcel, keepSpaces]);
  const im = useMemo(() => impact(scenario.homes), [scenario.homes]);

  const tabs = [
    { value: 'letter' as const, label: t('pitch.letter') },
    { value: 'onePager' as const, label: t('pitch.onePager') },
    { value: 'objections' as const, label: t('pitch.objections') },
    { value: 'practice' as const, label: t('pitch.practice') },
  ];

  return (
    <PageShell
      title={t('pitch.title')}
      lane={t('lane.pitch')} subtitle={`${parcel.displayName} · ${parcel.city}`}
      backdrop={<DeskBackdrop night={theme === 'dark'} />}
    >
      <div className="mb-6 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 pb-1">
        <Segmented value={tab} onChange={setTab} options={tabs} ariaLabel={t('pitch.title')} className="[&_button]:whitespace-nowrap" />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.section key={tab} {...rise} role="tabpanel" aria-label={tabs.find((x) => x.value === tab)?.label}>
          {tab === 'letter' && (
            <LetterTab parcel={parcel} keepSpaces={keepSpaces} lang={lang} setLang={setLang} letters={letters} setLetters={setLetters} staffCopy={staffCopy} setStaffCopy={setStaffCopy} />
          )}
          {tab === 'onePager' && (
            <OnePagerTab parcel={parcel} scenario={scenario} impact={im} lang={lang} setLang={setLang} />
          )}
          {tab === 'objections' && (
            <ObjectionsTab parcel={parcel} keepSpaces={keepSpaces} state={objections} setState={setObjections} />
          )}
          {tab === 'practice' && <PracticeTab parcel={parcel} keepSpaces={keepSpaces} />}
        </motion.section>
      </AnimatePresence>
    </PageShell>
  );
}
