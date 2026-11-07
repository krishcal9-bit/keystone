'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Landing } from './Landing';

const Intro = dynamic(() => import('@/components/intro/Intro').then((m) => m.Intro), { ssr: false, loading: () => null });

/** Hero DOM is rendered from the start underneath the intro; the intro hands off to it when done or skipped. */
export function LandingShell() {
  const [introDone, setIntroDone] = useState(false);
  return (
    <>
      <Landing introDone={introDone} />
      {!introDone && <Intro onDone={() => setIntroDone(true)} />}
    </>
  );
}
