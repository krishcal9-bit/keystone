'use client';
import { useEffect } from 'react';
/** Placeholder until the full intro lands: hands off immediately. */
export function Intro({ onDone }: { onDone: () => void }) {
  useEffect(() => { const id = setTimeout(onDone, 50); return () => clearTimeout(id); }, [onDone]);
  return null;
}
