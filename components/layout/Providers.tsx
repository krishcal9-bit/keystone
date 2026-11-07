'use client';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import { Toaster } from '@/components/ui/Toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <I18nProvider>
          {children}
          <Toaster />
        </I18nProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
