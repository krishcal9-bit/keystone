import { Fragment, type ReactNode } from 'react';

/** Tiny Markdown renderer for streamed Claude text: ## headings, bullets, numbered lists, **bold**, _italic_. */
export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let list: { type: 'ul' | 'ol'; items: ReactNode[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.type;
    out.push(<Tag key={`l${out.length}`} className={`${list.type === 'ul' ? 'list-disc' : 'list-decimal'} pl-5 flex flex-col gap-1 my-2`}>{list.items.map((it, i) => <li key={i} className="pl-1">{it}</li>)}</Tag>);
    list = null;
  };
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (h) { flush(); out.push(<h3 key={i} className="text-[15px] font-semibold text-ink mt-4 mb-1 first:mt-0">{inline(h[2])}</h3>); return; }
    if (ul) { if (!list || list.type !== 'ul') { flush(); list = { type: 'ul', items: [] }; } list.items.push(inline(ul[1])); return; }
    if (ol) { if (!list || list.type !== 'ol') { flush(); list = { type: 'ol', items: [] }; } list.items.push(inline(ol[1])); return; }
    flush();
    if (line.trim() === '') return;
    out.push(<p key={i} className="my-1.5">{inline(line)}</p>);
  });
  flush();
  return <div className={`text-[15px] leading-6 text-ink ${className}`}>{out}</div>;
}

function inline(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('_') && p.endsWith('_') && p.length > 2) return <em key={i} className="text-ink-2 not-italic">{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}
