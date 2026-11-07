'use client';
/**
 * The intro (~4.5 s, skippable). Dusk → light with a blueprint; the arch assembles; the keystone locks;
 * the camera dives into Orange County; the name reveals letter by letter; the lockup flies to the header.
 * The hero DOM is already rendered underneath; this overlay only covers it until the handoff.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useTheme } from '@/lib/theme';
import { useT } from '@/lib/i18n';
import { palette as P } from '@/lib/illustrationPalette';
import { ease } from '@/lib/motion';
import { COUNTY_PATH, COAST_PATH, FREEWAYS, CITY_LABELS, ll } from '@/components/map/ocGeo';
import { parcels } from '@/lib/data';
import { KeystoneIcon } from '@/components/brand/KeystoneIcon';
import { webglQuality } from '@/lib/webgl';

const ArchScene = dynamic(() => import('./ArchScene').then((m) => m.ArchScene), { ssr: false, loading: () => null });

const T_NAME = 3700, T_HOLD_END = 5600, T_FLY = 700;
const LETTERS = 'Keystone'.split('');
/** Timeline milestones that change what is rendered; everything in between is a CSS/Motion tween. */
const STAGES = [500, 700, 2700, 3000, 3600, T_NAME];

export function Intro({ onDone, onArm }: { onDone: () => void; onArm?: () => void }) {
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const { t } = useT();
  const night = theme === 'dark';
  const tRef = useRef(0);
  const fastRef = useRef(false);
  const [phase, setPhase] = useState<'play' | 'fly' | 'done'>('play');
  // Discrete timeline stage (ms crossed): the render tree only updates at milestones, never per frame.
  const [ms, setMs] = useState(0);
  const [flyTarget, setFlyTarget] = useState<{ x: number; y: number; scale: number } | null>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const readyRef = useRef(false);
  const mountRef = useRef(0);
  const phaseRef = useRef<'play' | 'fly' | 'done'>('play');
  const [arch, setArch] = useState<boolean | null>(null);
  const archRef = useRef<boolean | null>(null);
  const armedRef = useRef(false);
  const onArmRef = useRef(onArm);
  onArmRef.current = onArm;
  const flyRef = useRef<() => void>(() => {});
  const stageRef = useRef(0);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    phaseRef.current = 'done';
    setPhase('done');
    onDone();
  }, [onDone]);

  const fly = useCallback(() => {
    if (phase !== 'play') return;
    const header = document.querySelector('#site-header a[aria-label="Keystone home"]') as HTMLElement | null;
    const big = lockupRef.current;
    if (header && big) {
      const h = header.getBoundingClientRect(), b = big.getBoundingClientRect();
      setFlyTarget({ x: h.left + h.width / 2 - (b.left + b.width / 2), y: h.top + h.height / 2 - (b.top + b.height / 2), scale: h.height / b.height });
    }
    phaseRef.current = 'fly';
    setPhase('fly');
    // safety: always hand off even if the fly animation cannot run
    setTimeout(() => finish(), (fastRef.current ? 200 : T_FLY) + 150);
  }, [phase, finish]);

  // skip on any input
  useEffect(() => {
    if (reduced) { onArmRef.current?.(); const id = setTimeout(finish, 150); return () => clearTimeout(id); }
    const skip = () => { if (phase === 'play') { fastRef.current = true; tRef.current = Math.max(tRef.current, T_NAME + 900); fly(); } };
    window.addEventListener('keydown', skip); window.addEventListener('pointerdown', skip); window.addEventListener('wheel', skip, { passive: true }); window.addEventListener('touchstart', skip, { passive: true });
    return () => { window.removeEventListener('keydown', skip); window.removeEventListener('pointerdown', skip); window.removeEventListener('wheel', skip); window.removeEventListener('touchstart', skip); };
  }, [reduced, phase, fly, finish]);

  useEffect(() => { const ok = webglQuality() === 'hardware'; archRef.current = ok; setArch(ok); if (!ok) readyRef.current = true; }, []);
  flyRef.current = fly;
  // timeline clock (started once; never restarted on phase changes)
  useEffect(() => {
    if (reduced) return;
    let t0 = performance.now();
    mountRef.current = t0;
    let raf = 0;
    const tick = () => {
      if (!fastRef.current) {
        const now = performance.now();
        // hold at the blueprint until the 3D chunk is ready (max 1.5 s), then continue
        if (!readyRef.current && now - mountRef.current < 1500 && now - t0 > 650) t0 = now - 650;
        tRef.current = now - t0;
        // no hardware WebGL: skip the arch (700–2700) and go straight to the map
        if (archRef.current === false && tRef.current > 700 && tRef.current < 2700) { t0 -= 2700 - tRef.current; tRef.current = 2700; }
      }
      const stage = STAGES.reduce((acc, m) => (tRef.current >= m ? m : acc), 0);
      if (stage !== stageRef.current) { stageRef.current = stage; setMs(stage); }
      if (tRef.current >= T_HOLD_END && phaseRef.current === 'play') flyRef.current();
      if (phaseRef.current !== 'done') raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  useEffect(() => { document.documentElement.setAttribute('data-intro', phase === 'done' ? 'done' : 'playing'); return () => document.documentElement.removeAttribute('data-intro'); }, [phase]);

  if (reduced) return <motion.div className="fixed inset-0 z-[70] bg-paper" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.15 }} />;

  const fast = fastRef.current;
  const flyDur = fast ? 0.2 : T_FLY / 1000;
  const mapIn = ms >= 2700;
  const nameIn = ms >= T_NAME;
  if (nameIn && !armedRef.current) { armedRef.current = true; setTimeout(() => onArm?.(), 0); }
  const archVisible = ms < 3600;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden" style={{ transform: 'translateZ(0)', willChange: 'transform' }} data-testid="intro" data-phase={phase} aria-hidden>
      {/* sky: deep twilight → page colour */}
      <motion.div className="absolute inset-0" animate={{ opacity: phase === 'fly' ? 0 : 1 }} transition={{ duration: flyDur, ease: ease.out }}
        style={{ background: night ? `linear-gradient(${P.nightSkyHigh}, ${P.nightSkyLow})` : 'linear-gradient(#DCE8EE, #F6F7F5)' }}>
        {/* twilight lifts over the first 700 ms (one opacity tween, no per-frame colour mixing) */}
        {!night && <motion.div className="absolute inset-0" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7, ease: ease.out }} style={{ background: 'linear-gradient(#152238, #2A3650)' }} />}
      </motion.div>
      {/* warm horizon glow */}
      <motion.div className="absolute inset-x-0 bottom-0 pointer-events-none" animate={{ opacity: mapIn ? 0 : 1 }} transition={{ duration: 0.9, ease: ease.out }} style={{ height: '50vh', background: 'radial-gradient(60% 50% at 50% 100%, rgba(227,184,102,0.35) 0%, rgba(227,184,102,0) 100%)' }} />
      {/* blueprint */}
      <Blueprint ms={ms} night={night} hidden={ms >= 3600} />
      {/* arch */}
      {archVisible && arch === true && (
        <motion.div className="absolute inset-0" animate={{ opacity: ms > 3000 ? 0 : 1 }} transition={{ duration: 0.5, ease: ease.out }}>
          <ArchScene tl={{ tRef, fast: fastRef }} night={night} onReady={() => { readyRef.current = true; }} />
        </motion.div>
      )}
      {/* Orange County map */}
      <OCMapIntro ms={ms} night={night} dim={nameIn} flying={phase === 'fly'} flyDur={flyDur} />
      {/* name */}
      <AnimatePresence>
        {nameIn && phase !== 'done' && (
          <motion.div key="name" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
            <motion.div
              ref={lockupRef}
              className="flex flex-col items-center origin-center"
              animate={phase === 'fly' && flyTarget ? { x: flyTarget.x, y: flyTarget.y, scale: flyTarget.scale, opacity: 0 } : { x: 0, y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: flyDur, bounce: 0, opacity: { duration: flyDur * 0.35, delay: flyDur * 0.65 } }}
              onAnimationComplete={() => { if (phase === 'fly') finish(); }}
              data-testid="intro-lockup"
            >
              <div className="flex items-center gap-[0.3em]" style={{ fontSize: 'clamp(64px, 9vw, 150px)' }}>
                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: ease.out }} className="inline-flex" style={{ height: '1em' }}>
                  <KeystoneIcon size={128} glow className="h-[0.95em] w-auto" />
                </motion.span>
                <span className="wordmark text-ink relative inline-flex overflow-hidden" style={{ lineHeight: 1.05, paddingBottom: '0.06em' }}>
                  {LETTERS.map((ch, i) => (
                    <motion.span key={i} className="inline-block" initial={{ y: '110%', opacity: 0, fontVariationSettings: '"wght" 300, "opsz" 144, "SOFT" 30, "WONK" 0' }}
                      animate={{ y: '0%', opacity: 1, fontVariationSettings: '"wght" 600, "opsz" 144, "SOFT" 30, "WONK" 0' }}
                      transition={{ delay: fast ? 0 : i * 0.04, duration: fast ? 0.15 : 0.55, ease: ease.out }}>
                      {ch}
                    </motion.span>
                  ))}
                  {/* brass notch on the K with a glint */}
                  <motion.span aria-hidden className="absolute" style={{ left: '0.085em', top: '0.1em', width: '0.08em', height: '0.07em', background: 'var(--brass)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }} transition={{ delay: fast ? 0 : 0.45, duration: 0.6 }} />
                </span>
              </div>
              <motion.p className="text-ink-2 font-sans" style={{ fontSize: 'clamp(16px, 1.6vw, 26px)', marginTop: '0.2em' }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: fast ? 0.05 : 0.5, duration: 0.5, ease: ease.out }}>
                {t('brand.tagline')}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* skip hint */}
      {phase === 'play' && <div className="absolute bottom-6 right-6 text-[13px] text-ink-2 opacity-70">{t('common.skip')}: click or press any key</div>}
    </div>
  );
}

function Blueprint({ ms, night, hidden }: { ms: number; night: boolean; hidden: boolean }) {
  const reveal = 1; // draws over the first 700 ms as a tween
  const stroke = night ? 'rgba(168,196,220,0.35)' : 'rgba(30,92,71,0.28)';
  return (
    <motion.svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" animate={{ opacity: hidden ? 0 : 1 }} transition={{ duration: 0.5 }}>
      <defs>
        <pattern id="bp-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke={stroke} strokeWidth="1" /></pattern>
        <clipPath id="bp-clip"><motion.circle cx="720" cy="450" initial={{ r: 0 }} animate={{ r: 1000 }} transition={{ duration: 0.7, ease: ease.out }} /></clipPath>
      </defs>
      <rect width="1440" height="900" fill="url(#bp-grid)" clipPath="url(#bp-clip)" />
      {/* survey lines + parcel boundary */}
      <motion.path d="M480 560 L960 560 L1000 420 L520 420 Z" fill="none" stroke={P.brass} strokeWidth={2} strokeDasharray="10 7" initial={{ pathLength: 0 }} animate={{ pathLength: reveal }} transition={{ duration: 0.7, ease: ease.inOut }} />
      <motion.path d="M200 450 H1240 M720 80 V820" stroke={stroke} strokeWidth={1} initial={{ pathLength: 0 }} animate={{ pathLength: reveal }} transition={{ duration: 0.7 }} />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: ms > 500 ? 0.9 : 0 }} transition={{ duration: 0.3 }} fontFamily="var(--font-public-sans)" fontSize="13" fill={night ? '#A7B4AE' : '#4A5753'}>
        <text x="1010" y="412">lot 2.1 ac</text>
        <text x="476" y="584">SB 4</text>
        <text x="730" y="96">N</text>
      </motion.g>
    </motion.svg>
  );
}

function OCMapIntro({ ms, night, dim, flying, flyDur }: { ms: number; night: boolean; dim: boolean; flying: boolean; flyDur: number }) {
  if (ms < 2700 && !flying) return null;
  return (
    <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: flying ? 0 : dim ? 0.25 : 1, scale: flying ? 1.05 : 1 }} transition={{ duration: flying ? flyDur : 1, ease: ease.out }} data-testid="intro-map">
      <svg viewBox="0 0 1000 1000" className="h-[110vh] w-auto">
        <path d={COUNTY_PATH} fill={night ? '#1C2A25' : '#EEF2EC'} stroke={night ? '#2E4139' : '#CFDAD2'} strokeWidth={2} />
        <path d={COAST_PATH} fill="none" stroke={night ? '#5F8AA6' : '#8FB4C7'} strokeWidth={4} strokeLinecap="round" />
        {FREEWAYS.map((f) => <path key={f.id} d={f.d} fill="none" stroke={night ? '#3A4A44' : '#D0D7D1'} strokeWidth={f.major ? 4 : 2.5} strokeLinecap="round" />)}
        {CITY_LABELS.filter((c) => c.size === 'lg').map((c) => { const p = ll(c.lon, c.lat); return <text key={c.name} x={p.x} y={p.y} textAnchor="middle" fontSize={16} fontWeight={600} fill={night ? '#A7B4AE' : '#4A5753'} fontFamily="var(--font-public-sans)">{c.name}</text>; })}
        {/* 60 markers as one CSS-driven layer (no per-marker Motion components to hydrate) */}
        <g data-on={ms > 2900 ? 'true' : 'false'}>
          {parcels.map((p, i) => (
            <g key={p.id} className="intro-mk" style={{ ['--d' as string]: `${i * 12}ms`, transformOrigin: `${p.mapX}px ${p.mapY}px` }}>
              <circle cx={p.mapX} cy={p.mapY} r={16} fill={P.brassLight} opacity={0.3} />
              <circle cx={p.mapX} cy={p.mapY} r={6} fill={P.brass} stroke={night ? '#0F1513' : '#FFFFFF'} strokeWidth={1.5} />
            </g>
          ))}
        </g>
      </svg>
    </motion.div>
  );
}
