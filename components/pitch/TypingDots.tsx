'use client';
import { motion, useReducedMotion } from 'motion/react';
import { dur, ease } from '@/lib/motion';

/** Three brass dots: the board member is composing a reply. */
export function TypingDots({ label }: { label: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-1" role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-brass"
          animate={reduced ? { opacity: 1 } : { y: [0, -3, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: dur.long, ease: ease.inOut, repeat: Infinity, delay: i * dur.micro }}
        />
      ))}
    </span>
  );
}
