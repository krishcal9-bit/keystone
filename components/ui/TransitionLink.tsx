'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';
import { navigateWithTransition, type NavDir } from '@/lib/viewTransition';

/** A Next Link that navigates through a View Transition (shared element when `shared` names an element on both pages). */
export function TransitionLink({ href, dir = 'forward', shared, onClick, ...rest }: ComponentProps<typeof Link> & { dir?: NavDir; shared?: string }) {
  const router = useRouter();
  const h = typeof href === 'string' ? href : href.pathname ?? '/';
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        const el = shared ? (document.querySelector(shared) as HTMLElement | null) : null;
        navigateWithTransition(router, h, { dir, sharedEl: el });
      }}
    />
  );
}
