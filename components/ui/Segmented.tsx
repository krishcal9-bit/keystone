'use client';
import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';
import { spring } from '@/lib/motion';

export type SegmentOption<T extends string> = { value: T; label: string; disabled?: boolean };

export function Segmented<T extends string>({ value, onChange, options, ariaLabel, size = 'md', className = '' }: {
  value: T; onChange: (v: T) => void; options: SegmentOption<T>[]; ariaLabel: string; size?: 'sm' | 'md'; className?: string;
}) {
  const id = useId();
  const reduced = useReducedMotion();
  const h = size === 'sm' ? 'h-9 text-[14px]' : 'h-11 text-[15px]';
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`inline-flex p-1 rounded-[8px] bg-paper border border-line ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`relative ${h} px-3 rounded-[6px] font-medium transition-colors duration-[120ms] disabled:opacity-40 ${active ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[6px] bg-surface border border-line shadow-[0_1px_2px_rgba(24,36,32,0.06)]"
                transition={reduced ? { duration: 0 } : spring.snappy}
              />
            )}
            <span className="relative z-[1]">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
