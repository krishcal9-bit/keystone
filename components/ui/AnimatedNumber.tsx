'use client';
import { useEffect, useRef, useState } from 'react';
import { useMotionValue, useSpring, useMotionValueEvent, useReducedMotion } from 'motion/react';

type Props = {
  value: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Snap instantly on first render (no roll from zero). */
  immediate?: boolean;
};

const safe = (n: number) => (Number.isFinite(n) ? n : 0);

export function AnimatedNumber({ value, format, locale = 'en-US', className = '', prefix = '', suffix = '', immediate = true }: Props) {
  const reduced = useReducedMotion();
  const target = safe(value);
  const mv = useMotionValue(immediate ? target : 0);
  const sp = useSpring(mv, { stiffness: 120, damping: 24, mass: 0.6 });
  const fmt = useRef(new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...format }));
  const [text, setText] = useState(() => fmt.current.format(immediate ? target : 0));
  const first = useRef(true);

  useEffect(() => {
    fmt.current = new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...format });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, JSON.stringify(format)]);

  useEffect(() => {
    if (reduced || (first.current && immediate)) {
      mv.jump(target); sp.jump(target); setText(fmt.current.format(target));
    } else {
      mv.set(target);
    }
    first.current = false;
  }, [target, reduced, immediate, mv, sp]);

  useMotionValueEvent(sp, 'change', (v) => {
    const digits = fmt.current.resolvedOptions().maximumFractionDigits ?? 0;
    const rounded = digits > 0 ? v : Math.round(v);
    setText(fmt.current.format(safe(rounded)));
  });

  return (
    <span className={`tabular-nums ${className}`} data-value={target}>
      {prefix}{text}{suffix}
    </span>
  );
}
