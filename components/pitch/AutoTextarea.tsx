'use client';
import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

/** A textarea that grows with its content (no inner scrollbar), so edited text behaves like text on a page. */
export function AutoTextarea({ value, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} rows={1} className={`block w-full resize-none overflow-hidden bg-transparent outline-none ${className}`} {...rest} />;
}
