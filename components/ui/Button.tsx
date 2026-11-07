'use client';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { spring } from '@/lib/motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

const base = 'inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap rounded-[8px] transition-[background-color,color,border-color] duration-[120ms] ease-out disabled:opacity-50 disabled:pointer-events-none';
const variants: Record<Variant, string> = {
  primary: 'bg-pine text-paper hover:bg-pine-deep',
  secondary: 'bg-surface text-ink border border-line hover:bg-pine-soft',
  ghost: 'bg-transparent text-ink hover:bg-pine-soft',
  danger: 'bg-transparent text-signal-red border border-line hover:bg-pine-soft',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[15px]',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-12 px-5 text-[16px]',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, className = '', children, disabled, ...rest }, ref,
) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...(rest as Record<string, unknown>)}
    >
      {loading ? <Spinner /> : icon}
      <span className="inline-grid">
        <span className="col-start-1 row-start-1">{children}</span>
      </span>
    </motion.button>
  );
});

export function ButtonLink({ href, variant = 'primary', size = 'md', className = '', children, icon, ...rest }: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode; icon?: ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link href={href} className={`${base} pressable ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/** Two equal-width primary actions. Reserved line height so wrapping never changes height. */
export function ButtonPair({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-3 [&>*]:min-h-12 [&>*]:h-auto [&>*]:py-3 [&>*]:whitespace-normal [&>*]:text-center ${className}`}>{children}</div>;
}

export function Spinner({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden style={{ animationDuration: '700ms' }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
