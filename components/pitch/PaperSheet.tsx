'use client';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import type { ContentLang } from '@/lib/sb4';
import { dur, ease, stagger } from '@/lib/motion';
import { AutoTextarea } from './AutoTextarea';

const LOCALE: Record<ContentLang, string> = { en: 'en-US', es: 'es-MX', vi: 'vi-VN', ko: 'ko-KR' };

/**
 * An off-white sheet with a fibre texture (CSS gradients only), a soft shadow, a letterhead and a date.
 * While text streams, paragraphs rise in one by one and the sheet grows with a layout animation.
 * Once the stream ends the sheet becomes editable and a pen signature draws itself.
 */
export function PaperSheet({ text, streaming, done, onChange, lang, placeholder, compact = false, night = false, id }: {
  text: string; streaming: boolean; done: boolean; onChange?: (t: string) => void; lang: ContentLang; placeholder: string; compact?: boolean; night?: boolean; id: string;
}) {
  const paragraphs = useMemo(() => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean), [text]);
  const date = useMemo(() => new Intl.DateTimeFormat(LOCALE[lang], { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()), [lang]);
  const fontSize = compact ? 15 : 17;
  const lineHeight = compact ? 24 : 28;
  const editable = done && !streaming && onChange;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.medium, ease: ease.out, layout: { duration: dur.medium, ease: ease.out } }}
      className="relative mx-auto w-full rounded-[3px]"
      style={{
        maxWidth: compact ? 560 : 680,
        padding: compact ? '32px 32px 36px' : '48px 48px 52px',
        color: '#2B2A26',
        backgroundColor: night ? '#EDE6D6' : '#FBF8F1',
        backgroundImage: [
          'repeating-linear-gradient(0deg, rgba(120,100,70,0.035) 0 1px, transparent 1px 3px)',
          'repeating-linear-gradient(90deg, rgba(120,100,70,0.028) 0 1px, transparent 1px 5px)',
          'radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.55), transparent 55%)',
        ].join(','),
        boxShadow: night
          ? '0 1px 2px rgba(0,0,0,0.3), 0 24px 48px -24px rgba(0,0,0,0.7)'
          : '0 1px 2px rgba(24,36,32,0.08), 0 24px 48px -28px rgba(24,36,32,0.4)',
        fontFamily: 'var(--font-display), Georgia, serif',
        fontVariationSettings: '"opsz" 18, "SOFT" 40, "WONK" 0',
        fontSize,
        lineHeight: `${lineHeight}px`,
      }}
      data-paper
    >
      {/* letterhead */}
      <div className="flex items-start justify-between gap-4 mb-7" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, lineHeight: '16px', color: '#6B665C' }}>
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 20V11.5A8 8 0 0 1 20 11.5V20h-4v-7a4 4 0 0 0-8 0v7Z" fill="#1E5C47" />
            <rect x="10" y="6" width="4" height="5" rx="1" fill="#B8862B" />
          </svg>
          <span>Habitat for Humanity of Orange County</span>
        </div>
        <span className="tabular-nums">{date}</span>
      </div>

      {editable ? (
        <AutoTextarea
          value={text}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label="Letter"
          spellCheck={false}
          className="text-inherit"
          style={{ font: 'inherit', fontVariationSettings: 'inherit', lineHeight: `${lineHeight}px`, color: 'inherit' }}
        />
      ) : paragraphs.length === 0 ? (
        <p className="italic" style={{ color: '#9A948A' }}>{placeholder}</p>
      ) : (
        <div className="flex flex-col" style={{ gap: lineHeight }}>
          {paragraphs.map((p, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: dur.short, ease: ease.out, delay: i === paragraphs.length - 1 ? 0 : stagger }}
              className="whitespace-pre-wrap"
            >
              {p}
              {streaming && i === paragraphs.length - 1 && <span aria-hidden className="inline-block w-[2px] h-[1em] align-[-0.15em] ml-0.5" style={{ background: '#B8862B', animation: 'ks-caret 1s steps(2) infinite' }} />}
            </motion.p>
          ))}
        </div>
      )}

      {done && !streaming && text.length > 0 && <Signature compact={compact} id={id} />}
      <style>{`@keyframes ks-caret { 50% { opacity: 0; } }`}</style>
    </motion.div>
  );
}

/** Brass pen signature: two strokes drawn with pathLength, then the name settles in beneath. */
function Signature({ compact, id }: { compact: boolean; id: string }) {
  const w = compact ? 200 : 250;
  return (
    <div className="mt-6 select-none" aria-hidden style={{ width: w }} data-signature={id}>
      <svg viewBox="0 0 260 70" width={w} height={(w * 70) / 260} fill="none" style={{ display: 'block' }}>
        <motion.path
          d="M8 48 C 20 20, 34 14, 30 36 C 26 56, 46 54, 56 34 C 62 22, 58 18, 52 30 C 46 44, 60 50, 76 40 C 92 30, 104 18, 98 34 C 92 52, 112 50, 124 36 C 132 26, 126 20, 120 32 C 114 46, 132 52, 150 40 C 168 28, 182 16, 176 34 C 170 52, 196 50, 212 34 C 222 24, 230 30, 240 24"
          stroke="#B8862B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: dur.long, ease: ease.inOut, delay: dur.short }, opacity: { duration: dur.micro, delay: dur.short } }}
        />
        <motion.path
          d="M18 60 C 80 54, 160 66, 246 56"
          stroke="#B8862B" strokeWidth="1.6" strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ pathLength: { duration: dur.medium, ease: ease.out, delay: dur.short + dur.long }, opacity: { duration: dur.micro, delay: dur.short + dur.long } }}
        />
      </svg>
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur.medium, ease: ease.out, delay: dur.short + dur.long + dur.medium }}
        style={{ fontFamily: 'var(--font-sans)', fontSize: 12, lineHeight: '16px', color: '#6B665C', marginTop: 2 }}
      >
        Habitat for Humanity of Orange County
      </motion.p>
    </div>
  );
}
