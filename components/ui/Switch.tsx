'use client';
import { motion, useReducedMotion } from 'motion/react';
import { spring } from '@/lib/motion';

export function Switch({ checked, onChange, label, className = '' }: { checked: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer select-none min-h-11 ${className}`}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full border transition-colors duration-[160ms] ${checked ? 'bg-pine border-pine' : 'bg-line border-line'}`}
      >
        <motion.span
          className="absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(24,36,32,0.25)]"
          animate={{ x: checked ? 20 : 0 }}
          transition={reduced ? { duration: 0 } : spring.snappy}
        />
      </button>
      <span className="text-[15px] text-ink">{label}</span>
    </label>
  );
}
