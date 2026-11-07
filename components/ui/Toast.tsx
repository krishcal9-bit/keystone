'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring, dur, ease } from '@/lib/motion';

type Toast = { id: number; text: string; tone?: 'default' | 'error' };
const listeners = new Set<(t: Toast) => void>();
let counter = 0;

export function toast(text: string, tone: Toast['tone'] = 'default') {
  const t = { id: ++counter, text, tone };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const l = (t: Toast) => {
      setItems((s) => [...s.slice(-2), t]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 2400);
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite" role="status">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: dur.short * 0.7, ease: ease.out } }}
            transition={spring.snappy}
            className={`px-4 h-11 inline-flex items-center rounded-[8px] text-[15px] font-medium shadow-[var(--shadow-soft)] border ${t.tone === 'error' ? 'bg-surface text-signal-red border-line' : 'bg-ink text-paper border-transparent'}`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
