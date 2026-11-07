'use client';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/Toast';
import { TourOverlay } from '@/components/tour/TourOverlay';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <I18nProvider>
          {children}
          <TourOverlay />
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
