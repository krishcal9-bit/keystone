'use client';
import { AnimatePresence, motion } from 'motion/react';
import { ease, dur } from '@/lib/motion';

/** Changing words swap vertically: old moves up 8px and fades, new rises from below. */
export function WordSwap({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-grid overflow-hidden align-bottom ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          className="col-start-1 row-start-1 whitespace-nowrap"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: dur.short, ease: ease.out }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
