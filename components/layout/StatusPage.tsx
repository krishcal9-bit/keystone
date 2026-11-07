'use client';
/** Shared frame for the 404 and error pages: a small illustration, headline, body and one primary action. */
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { dur, ease, stagger } from '@/lib/motion';
import { EmptyLot } from '@/components/scenes/EmptyLot';

export function StatusPage({ title, body, action, detail }: { title: string; body: string; action: ReactNode; detail?: string }) {
  const reduced = useReducedMotion();
  const item = (i: number) => ({
    initial: reduced ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: dur.medium, ease: ease.out, delay: i * stagger * 2 },
  });
  return (
    <div className="min-h-svh pt-16 flex items-center justify-center px-5">
      <div className="w-full max-w-[520px] flex flex-col items-center text-center pb-24">
        <motion.div {...item(0)} className="mb-6">
          <EmptyLot className="w-[300px] md:w-[360px]" />
        </motion.div>
        <motion.h1 {...item(1)} className="headline-md text-ink">{title}</motion.h1>
        <motion.p {...item(2)} className="mt-4 text-[18px] leading-7 text-ink-2 max-w-[42ch]">{body}</motion.p>
        {detail && <motion.p {...item(3)} className="mt-2 text-[13px] leading-[18px] text-ink-2 font-mono break-words max-w-full">{detail}</motion.p>}
        <motion.div {...item(3)} className="mt-8">{action}</motion.div>
      </div>
    </div>
  );
}
