'use client';
import { usePathname } from 'next/navigation';

/** Page transition fallback: a short CSS rise + fade on inner routes; the landing paints as-is (the intro handles its own entrance). */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className={pathname === '/' ? undefined : 'rise-in'}>{children}</div>;
}
