'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from '@/lib/theme';
import { useT } from '@/lib/i18n';
import { allStats, totals } from '@/lib/siteStats';
import { spring } from '@/lib/motion';
import type { ExplainerPhase } from '@/components/explainer/useExplainer';
import { useSectionNav } from './useSectionNav';
import { Section } from './Section';
import { ButtonLink, ButtonPair } from '@/components/ui/Button';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import dynamic from 'next/dynamic';
const ClosingScene = dynamic(() => import('@/components/scenes/StreetScene').then((m) => m.ClosingScene), { ssr: false });
const ChurchCampusScene = dynamic(() => import('@/components/scenes/ChurchCampusScene').then((m) => m.ChurchCampusScene), { ssr: false });
const AerialScanScene = dynamic(() => import('@/components/scenes/AerialScanScene').then((m) => m.AerialScanScene), { ssr: false });
const PlanMiniScene = dynamic(() => import('@/components/scenes/PlanMiniScene').then((m) => m.PlanMiniScene), { ssr: false });
const DeskScene = dynamic(() => import('@/components/scenes/DeskScene').then((m) => m.DeskScene), { ssr: false });
const IsoBlockScene = dynamic(() => import('@/components/scenes/IsoBlockScene').then((m) => m.IsoBlockScene), { ssr: false });
const ChallengeScene = dynamic(() => import('@/components/scenes/ChallengeScene').then((m) => m.ChallengeScene), { ssr: false });
const HowItWorksScene = dynamic(() => import('@/components/scenes/HowItWorksScene').then((m) => m.HowItWorksScene), { ssr: false });
const SearchVsWaitScene = dynamic(() => import('@/components/scenes/SearchVsWaitScene').then((m) => m.SearchVsWaitScene), { ssr: false });
const LuckScene = dynamic(() => import('@/components/scenes/LuckScene').then((m) => m.LuckScene), { ssr: false });
import type { SceneProps } from '@/components/scenes/types';

const COUNT = 11;

export function Landing({ introDone, heroArmed = true, hero }: { introDone: boolean; heroArmed?: boolean; hero: React.ReactNode }) {
  const { theme } = useTheme();
  const { t } = useT();
  const reduced = !!useReducedMotion();
  const night = theme === 'dark';
  const nav = useSectionNav(COUNT, introDone, reduced);
  const stats = useMemo(() => totals(allStats()), []);
  const [phases, setPhases] = useState<Record<number, ExplainerPhase>>({});
  const [replayKeys, setReplayKeys] = useState<Record<number, number>>({});
  const [finishKeys, setFinishKeys] = useState<Record<number, number>>({});
  const setPhase = useCallback((i: number) => (p: ExplainerPhase) => setPhases((s) => (s[i] === p ? s : { ...s, [i]: p })), []);

  const onNext = (i: number) => {
    if (phases[i] === 'playing') { setFinishKeys((s) => ({ ...s, [i]: (s[i] ?? 0) + 1 })); return; }
    if (i === COUNT - 1) nav.goTo(0); else nav.next();
  };
  // Down key mid-sequence completes the sequence first
  useEffect(() => {
    if (!introDone) return;
    const onKey = (e: KeyboardEvent) => {
      const tEl = e.target as HTMLElement | null;
      if (tEl && (tEl.tagName === 'INPUT' || tEl.tagName === 'TEXTAREA' || tEl.tagName === 'SELECT')) return;
      if (['ArrowDown', 'PageDown', ' ', 'j', 'J'].includes(e.key) && phases[nav.active] === 'playing') {
        e.stopImmediatePropagation(); e.preventDefault();
        setFinishKeys((s) => ({ ...s, [nav.active]: (s[nav.active] ?? 0) + 1 }));
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [introDone, phases, nav.active]);

  const sceneProps = (i: number): SceneProps => ({
    active: introDone && nav.active === i,
    night, reduced,
    replayKey: replayKeys[i] ?? 0,
    finishKey: finishKeys[i] ?? 0,
    onPhase: setPhase(i),
    startDone: phases[i] === 'done',
  });
  // Only the active section and its neighbours are mounted (preloaded); others keep their height and paint nothing.
  // Neighbours mount ~900 ms after a section change so the transition itself never pays the mount cost.
  const [settledActive, setSettledActive] = useState(0);
  useEffect(() => { const id = setTimeout(() => setSettledActive(nav.active), 900); return () => clearTimeout(id); }, [nav.active]);
  const near = (i: number) => introDone && (i === nav.active || Math.abs(i - settledActive) <= 1);
  const shift = (i: number) => (i - nav.active) * 48;
  const sec = (i: number) => ({ index: i, active: introDone && nav.active === i, shift: shift(i), near: near(i) || i === 0, onNext: () => onNext(i), phase: phases[i], onReplay: phases[i] ? () => setReplayKeys((s) => ({ ...s, [i]: (s[i] ?? 0) + 1 })) : undefined });

  return (
    <div id="landing" className="relative" data-testid="landing" data-intro-done={introDone}>
      <div ref={nav.register(0)}>
        <Section {...sec(0)} id="hero" phase={undefined} onReplay={undefined} textWidth="lg" visibleOverride={!introDone && !heroArmed ? true : undefined}
          text={{
            title: t('hero.title'), body: t('hero.sub'),
            actions: (
              <ButtonPair>
                <ButtonLink href="/sites" size="lg" data-testid="cta-find">{t('hero.findSites')}</ButtonLink>
                <ButtonLink href="#law" variant="secondary" size="lg" data-testid="cta-how" onClick={(e) => { e.preventDefault(); nav.goTo(3); }}>{t('hero.howItWorks')}</ButtonLink>
              </ButtonPair>
            ),
          }}>
          {hero}
          <HeroCounter sites={stats.sites} homes={stats.homes} />
        </Section>
      </div>
      <div ref={nav.register(1)}>
        <Section {...sec(1)} id="challenge" textWidth="lg" text={{ kicker: t('land.chal.kicker'), title: t('land.chal.title'), body: t('land.chal.body') }}>
          {near(1) && <ChallengeScene {...sceneProps(1)} />}
        </Section>
      </div>
      <div ref={nav.register(2)}>
        <Section {...sec(2)} id="luck" text={{ kicker: t('land.luck.kicker'), title: t('land.luck.title'), body: t('land.luck.body') }}>
          {near(2) && <LuckScene {...sceneProps(2)} />}
        </Section>
      </div>
      <div ref={nav.register(3)}>
        <Section {...sec(3)} id="law" text={{ kicker: t('land.s2.kicker'), title: t('land.s2.title'), body: t('land.s2.body') }}>
          {near(3) && <ChurchCampusScene {...sceneProps(3)} />}
        </Section>
      </div>
      <div ref={nav.register(4)}>
        <Section {...sec(4)} id="how" text={{ kicker: t('land.hiw.kicker'), title: t('land.hiw.title'), body: t('land.hiw.body') }}>
          {near(4) && <HowItWorksScene {...sceneProps(4)} />}
        </Section>
      </div>
      <div ref={nav.register(5)}>
        <Section {...sec(5)} id="searching" textWidth="lg" text={{ kicker: t('land.svw.kicker'), title: t('land.svw.title') }}>
          {near(5) && <SearchVsWaitScene {...sceneProps(5)} />}
        </Section>
      </div>
      <div ref={nav.register(6)}>
        <Section {...sec(6)} id="scan" text={{ kicker: t('land.s3.kicker'), title: t('land.s3.title'), body: t('land.s3.body') }}>
          {near(6) && <AerialScanScene {...sceneProps(6)} />}
        </Section>
      </div>
      <div ref={nav.register(7)}>
        <Section {...sec(7)} id="plan" text={{ kicker: t('land.s4.kicker'), title: t('land.s4.title'), body: t('land.s4.body') }}>
          {near(7) && <PlanMiniScene {...sceneProps(7)} />}
        </Section>
      </div>
      <div ref={nav.register(8)}>
        <Section {...sec(8)} id="pitch" text={{ kicker: t('land.s5.kicker'), title: t('land.s5.title'), body: t('land.s5.body') }}>
          {near(8) && <DeskScene {...sceneProps(8)} />}
        </Section>
      </div>
      <div ref={nav.register(9)}>
        <Section {...sec(9)} id="pipeline" text={{ kicker: t('land.s6.kicker'), title: t('land.s6.title'), body: t('land.s6.body') }}>
          {near(9) && <IsoBlockScene {...sceneProps(9)} />}
        </Section>
      </div>
      <div ref={nav.register(10)}>
        <Section {...sec(10)} id="close" isLast align="center" textWidth="lg" phase={undefined} onReplay={undefined}
          text={{ title: t('land.close.title'), actions: <div className="mx-auto max-w-[260px]"><ButtonLink href="/sites" size="lg" className="w-full">{t('hero.findSites')}</ButtonLink></div> }}
          counter={<div className="text-center"><span className="big-number text-pine"><AnimatedNumber value={introDone && nav.active === 10 ? stats.homes : 0} immediate={false} /></span><div className="text-[15px] text-ink-2 mt-1">{t('land.close.sub')}</div></div>}>
          {near(10) && <ClosingScene {...sceneProps(10)} />}
        </Section>
      </div>
      {/* section dots */}
      <nav aria-label={t('land.sectionNav')} className="fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-[40] flex flex-col gap-2.5 items-center" data-testid="section-dots">
        {Array.from({ length: COUNT }).map((_, i) => {
          const on = nav.active === i;
          return (
            <button key={i} type="button" onClick={() => nav.goTo(i)} aria-label={`${t('land.goTo')} ${i + 1}`} aria-current={on ? 'true' : undefined} className="relative w-6 h-6 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-ink-2/40" />
              {on && <motion.span layoutId="dot-pill" className="absolute w-2.5 h-5 rounded-full bg-pine" transition={reduced ? { duration: 0 } : spring.snappy} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function HeroCounter({ sites, homes }: { sites: number; homes: number }) {
  const { t } = useT();
  return (
    <div className="hidden md:block absolute right-5 md:right-10 lg:right-20 top-[calc(110px+16vw)] lg:top-[300px] panel px-4 py-2.5 text-right pointer-events-none" data-testid="hero-counter" aria-live="polite">
      <div className="text-[22px] font-semibold tabular-nums text-ink leading-7">
        <AnimatedNumber value={sites} /> {t('hero.counter')} · <AnimatedNumber value={homes} /> {t('hero.potential')}
      </div>
    </div>
  );
}
