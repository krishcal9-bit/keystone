'use client';
/**
 * Tiny Markdown-ish renderer for streamed briefs: "## " headings, "- " bullets, "1. " numbered items,
 * paragraphs, **bold** and _italic_ inline. No dependencies; safe (renders text nodes only).
 */
import { Fragment, type ReactNode } from 'react';

type Block =
  | { kind: 'h'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'p'; text: string };

function parse(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { blocks.push({ kind: 'p', text: para.join(' ') }); para = []; } };
  for (const raw of src.split('\n')) {
    const line = raw.trimEnd();
    const h = /^#{1,4}\s+(.*)$/.exec(line);
    const ul = /^[-*•]\s+(.*)$/.exec(line);
    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (!line.trim()) { flush(); continue; }
    if (h) { flush(); blocks.push({ kind: 'h', text: h[1] }); continue; }
    if (ul) { flush(); const last = blocks[blocks.length - 1]; if (last?.kind === 'ul') last.items.push(ul[1]); else blocks.push({ kind: 'ul', items: [ul[1]] }); continue; }
    if (ol) { flush(); const last = blocks[blocks.length - 1]; if (last?.kind === 'ol') last.items.push(ol[1]); else blocks.push({ kind: 'ol', items: [ol[1]] }); continue; }
    para.push(line.trim());
  }
  flush();
  return blocks;
}

function inline(text: string): ReactNode {
  // **bold**, _italic_ (whole-word), plain otherwise.
  const parts = text.split(/(\*\*[^*]+\*\*|(?<![\w])_[^_]+_(?![\w]))/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>;
    if (p.startsWith('_') && p.endsWith('_') && p.length > 2) return <em key={i} className="text-ink-2 not-italic">{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export function Markdownish({ text, className = '' }: { text: string; className?: string }) {
  const blocks = parse(text);
  return (
    <div className={`text-[16px] leading-[26px] text-ink [&>*+*]:mt-2 ${className}`}>
      {blocks.map((b, i) => {
        if (b.kind === 'h') return <h3 key={i} className="font-sans text-[13px] font-semibold tracking-normal text-ink-2 pt-3 first:pt-0 [text-wrap:initial]">{inline(b.text)}</h3>;
        if (b.kind === 'ul') return <ul key={i} className="list-disc pl-5 marker:text-pine [&>li+li]:mt-1">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>;
        if (b.kind === 'ol') return <ol key={i} className="list-decimal pl-5 marker:text-pine marker:tabular-nums [&>li+li]:mt-1">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>;
        return <p key={i}>{inline(b.text)}</p>;
      })}
    </div>
  );
}
