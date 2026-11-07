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
import { StreetScene, ClosingScene } from '@/components/scenes/StreetScene';
import { ChurchCampusScene } from '@/components/scenes/ChurchCampusScene';
import { AerialScanScene } from '@/components/scenes/AerialScanScene';
import { PlanMiniScene } from '@/components/scenes/PlanMiniScene';
import { DeskScene } from '@/components/scenes/DeskScene';
import { IsoBlockScene } from '@/components/scenes/IsoBlockScene';
import { ChallengeScene } from '@/components/scenes/ChallengeScene';
import { LuckScene } from '@/components/scenes/LuckScene';
import type { SceneProps } from '@/components/scenes/types';

const COUNT = 9;

export function Landing({ introDone, heroArmed = true }: { introDone: boolean; heroArmed?: boolean }) {
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
  });
  const shift = (i: number) => (i - nav.active) * 48;
  const sec = (i: number) => ({ index: i, active: introDone && nav.active === i, shift: shift(i), onNext: () => onNext(i), phase: phases[i], onReplay: phases[i] ? () => setReplayKeys((s) => ({ ...s, [i]: (s[i] ?? 0) + 1 })) : undefined });

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
          <StreetScene {...sceneProps(0)} />
          <HeroCounter active={introDone && nav.active === 0} sites={stats.sites} homes={stats.homes} />
        </Section>
      </div>
      <div ref={nav.register(1)}>
        <Section {...sec(1)} id="challenge" textWidth="lg" text={{ kicker: t('land.chal.kicker'), title: t('land.chal.title'), body: t('land.chal.body') }}>
          {introDone && <ChallengeScene {...sceneProps(1)} />}
        </Section>
      </div>
      <div ref={nav.register(2)}>
        <Section {...sec(2)} id="luck" text={{ kicker: t('land.luck.kicker'), title: t('land.luck.title'), body: t('land.luck.body') }}>
          {introDone && <LuckScene {...sceneProps(2)} />}
        </Section>
      </div>
      <div ref={nav.register(3)}>
        <Section {...sec(3)} id="law" text={{ kicker: t('land.s2.kicker'), title: t('land.s2.title'), body: t('land.s2.body') }}>
          {introDone && <ChurchCampusScene {...sceneProps(3)} />}
        </Section>
      </div>
      <div ref={nav.register(4)}>
        <Section {...sec(4)} id="scan" text={{ kicker: t('land.s3.kicker'), title: t('land.s3.title'), body: t('land.s3.body') }}>
          {introDone && <AerialScanScene {...sceneProps(4)} />}
        </Section>
      </div>
      <div ref={nav.register(5)}>
        <Section {...sec(5)} id="plan" text={{ kicker: t('land.s4.kicker'), title: t('land.s4.title'), body: t('land.s4.body') }}>
          {introDone && <PlanMiniScene {...sceneProps(5)} />}
        </Section>
      </div>
      <div ref={nav.register(6)}>
        <Section {...sec(6)} id="pitch" text={{ kicker: t('land.s5.kicker'), title: t('land.s5.title'), body: t('land.s5.body') }}>
          {introDone && <DeskScene {...sceneProps(6)} />}
        </Section>
      </div>
      <div ref={nav.register(7)}>
        <Section {...sec(7)} id="pipeline" text={{ kicker: t('land.s6.kicker'), title: t('land.s6.title'), body: t('land.s6.body') }}>
          {introDone && <IsoBlockScene {...sceneProps(7)} />}
        </Section>
      </div>
      <div ref={nav.register(8)}>
        <Section {...sec(8)} id="close" isLast align="center" textWidth="lg" phase={undefined} onReplay={undefined}
          text={{ title: t('land.close.title'), actions: <div className="mx-auto max-w-[260px]"><ButtonLink href="/sites" size="lg" className="w-full">{t('hero.findSites')}</ButtonLink></div> }}
          counter={<div className="text-center"><span className="big-number text-pine"><AnimatedNumber value={introDone && nav.active === 8 ? stats.homes : 0} immediate={false} /></span><div className="text-[15px] text-ink-2 mt-1">{t('land.close.sub')}</div></div>}>
          {introDone && <ClosingScene {...sceneProps(8)} />}
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

function HeroCounter({ active, sites, homes }: { active: boolean; sites: number; homes: number }) {
  const { t } = useT();
  return (
    <div className="hidden md:block absolute right-5 md:right-10 lg:right-20 top-[calc(110px+16vw)] lg:top-[300px] panel px-4 py-2.5 text-right pointer-events-none" data-testid="hero-counter" aria-live="polite">
      <div className="text-[22px] font-semibold tabular-nums text-ink leading-7">
        <AnimatedNumber value={active ? sites : 0} immediate={false} /> {t('hero.counter')} · <AnimatedNumber value={active ? homes : 0} immediate={false} /> {t('hero.potential')}
      </div>
    </div>
  );
}
