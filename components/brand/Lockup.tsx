'use client';
import Link from 'next/link';
import { KeystoneIcon } from './KeystoneIcon';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

/**
 * Icon left, wordmark, tagline below at ~22% of wordmark size.
 * `size` is the wordmark cap height in px (header ≈ 28).
 */
export function Lockup({ size = 28, tagline = true, href = '/', className = '', as = 'link' }: { size?: number; tagline?: boolean; href?: string; className?: string; as?: 'link' | 'div' }) {
  const { t } = useT();
  const { theme } = useTheme();
  const inner = (
    <span className={`inline-flex items-center gap-[0.38em] ${className}`} style={{ fontSize: size }}>
      <KeystoneIcon size={size * 1.15} glow={theme === 'dark'} />
      <span className="inline-flex flex-col leading-none">
        <Wordmark size={size} />
        {tagline && (
          <span className="font-sans text-ink-2" style={{ fontSize: Math.max(10, size * 0.42), lineHeight: 1.1, marginTop: size * 0.12, letterSpacing: 0 }}>
            {t('brand.tagline')}
          </span>
        )}
      </span>
    </span>
  );
  if (as === 'div') return <div className="inline-flex">{inner}</div>;
  return (
    <Link href={href} aria-label="Keystone home" className="inline-flex rounded-[8px] vt-lockup">
      {inner}
    </Link>
  );
}

/** "Keystone" in Fraunces with a tiny brass notch at the top of the K's stem. */
export function Wordmark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`wordmark relative inline-block text-ink ${className}`} style={{ fontSize: size }} aria-label="Keystone">
      <span aria-hidden className="absolute" style={{
        left: '0.085em', top: '0.1em', width: '0.08em', height: '0.07em',
        background: 'var(--brass)', borderRadius: '0 0 0.02em 0.02em',
        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
      }} />
      Keystone
    </span>
  );
}
