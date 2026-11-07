'use client';
import { motion } from 'motion/react';
import { ease, dur } from '@/lib/motion';

/** Page transition fallback: a short rise + fade on every route change. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.medium, ease: ease.out }}>
      {children}
    </motion.div>
  );
}
