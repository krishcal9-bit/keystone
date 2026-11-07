'use client';
import type { ReactNode } from 'react';
import { SampleDataLabel } from '@/components/ui/Pill';

/**
 * Inner-page frame: fixed header offset, 12-column grid with ≥ 80 px side margins on desktop,
 * an optional illustrated backdrop filling the page behind the content at low intensity (the root
 * then carries `data-scene`, which turns `.panel` into translucent paper), title row with the
 * persistent "Sample data" label.
 */
export function PageShell({ title, subtitle, lane, children, backdrop, actions, sample = true, width = 'wide', titleId }: {
  title: string; subtitle?: string; lane?: string; children: ReactNode; backdrop?: ReactNode; actions?: ReactNode; sample?: boolean; width?: 'wide' | 'narrow'; titleId?: string;
}) {
  return (
    <div className="relative min-h-svh pt-16" data-scene={backdrop ? '' : undefined}>
      {backdrop && <div className="absolute inset-x-0 top-16 bottom-0 overflow-hidden pointer-events-none select-none" aria-hidden>{backdrop}</div>}
      <div className={`relative mx-auto px-5 md:px-10 lg:px-20 ${width === 'narrow' ? 'max-w-[1000px]' : 'max-w-[1440px]'} pt-8 pb-20`}>
        <div className="rise-in flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="max-w-[720px]">
            <div className="flex items-center gap-3 mb-1">
              <h1 id={titleId} className="headline-md">{title}</h1>
              {sample && <SampleDataLabel />}
            </div>
            {lane && <p className="text-[14px] text-pine font-medium mb-1" data-testid="lane-line">{lane}</p>}
            {subtitle && <p className="text-ink-2 text-[18px] leading-7">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
