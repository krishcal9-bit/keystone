import type { ReactNode } from 'react';

export function Pill({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'pine' | 'brass' | 'red' | 'amber'; className?: string }) {
  const tones = {
    neutral: 'bg-paper text-ink-2 border-line',
    pine: 'bg-pine-soft text-pine border-transparent',
    brass: 'bg-[color-mix(in_srgb,var(--brass)_16%,transparent)] text-brass border-transparent',
    red: 'bg-[color-mix(in_srgb,var(--signal-red)_12%,transparent)] text-signal-red border-transparent',
    amber: 'bg-[color-mix(in_srgb,var(--signal-amber)_14%,transparent)] text-signal-amber border-transparent',
  };
  return <span className={`inline-flex items-center h-6 px-2 rounded-full border text-[13px] font-medium leading-none ${tones[tone]} ${className}`}>{children}</span>;
}

export function SampleDataLabel({ className = '' }: { className?: string }) {
  return <Pill tone="neutral" className={className}>Sample data</Pill>;
}
