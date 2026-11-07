'use client';
import { useState } from 'react';
import { Landing } from './Landing';
import { Intro } from '@/components/intro/Intro';

/** Hero DOM is rendered from the start underneath the intro; the intro hands off to it when done or skipped. */
export function LandingShell() {
  const [introDone, setIntroDone] = useState(false);
  const [armed, setArmed] = useState(false);
  return (
    <>
      <Landing introDone={introDone} heroArmed={armed} />
      {!introDone && <Intro onDone={() => setIntroDone(true)} onArm={() => setArmed(true)} />}
    </>
  );
}
