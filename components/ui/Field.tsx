import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from 'react';

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-ink-2">{hint}</span>}
    </label>
  );
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={`appearance-none w-full h-11 pl-3 pr-9 rounded-[8px] bg-surface border border-line text-[15px] text-ink hover:border-ink-2 transition-colors duration-[120ms] ${className}`} {...rest}>
        {children}
      </select>
      <svg aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-2" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full h-11 px-3 rounded-[8px] bg-surface border border-line text-[15px] text-ink placeholder:text-ink-2/70 hover:border-ink-2 transition-colors duration-[120ms] ${className}`} {...rest} />;
}

export function Checkbox({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <label className="inline-flex items-center gap-2.5 min-h-11 cursor-pointer select-none text-[15px]" data-testid={testId}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={`w-5 h-5 rounded-[5px] border inline-flex items-center justify-center transition-colors duration-[120ms] ${checked ? 'bg-pine border-pine' : 'bg-surface border-line'}`} aria-hidden>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="#F6F7F5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 14, strokeDashoffset: checked ? 0 : 14, transition: 'stroke-dashoffset 200ms var(--ease-out)' }} />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  );
}
