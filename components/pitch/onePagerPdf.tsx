'use client';
import { createElement as h } from 'react';

export type OnePagerPdfData = {
  title: string;
  name: string;
  city: string;
  numbers: { value: string; label: string }[];
  keepsTitle: string;
  keeps: string[];
  sb4Title: string;
  sb4: string[];
  notLegal: string;
  sample: string;
  footer: string;
};

/**
 * Builds the one-page PDF client-side. `@react-pdf/renderer` is imported dynamically so it never
 * lands in the main bundle. Text-only: the numbers, what the congregation keeps and SB 4 in three sentences.
 */
export async function exportOnePagerPdf(d: OnePagerPdfData, fileName: string) {
  const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer');
  const s = StyleSheet.create({
    page: { padding: 56, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5, color: '#182420' },
    eyebrow: { fontSize: 10, color: '#4A5753', marginBottom: 6 },
    title: { fontFamily: 'Times-Roman', fontSize: 26, lineHeight: 1.15, marginBottom: 4 },
    city: { fontSize: 11, color: '#4A5753', marginBottom: 24 },
    numbers: { flexDirection: 'row', borderTop: '1 solid #DDE3DF', borderBottom: '1 solid #DDE3DF', paddingVertical: 16, marginBottom: 24 },
    numCell: { flex: 1, paddingRight: 12 },
    numValue: { fontFamily: 'Times-Roman', fontSize: 30, lineHeight: 1 },
    numLabel: { fontSize: 10, color: '#4A5753', marginTop: 4 },
    h2: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginBottom: 8 },
    item: { flexDirection: 'row', marginBottom: 6 },
    bullet: { width: 12, color: '#1E5C47' },
    itemText: { flex: 1 },
    section: { marginBottom: 20 },
    foot: { position: 'absolute', left: 56, right: 56, bottom: 40, fontSize: 9, color: '#4A5753', borderTop: '1 solid #DDE3DF', paddingTop: 8 },
  });

  const doc = h(Document, { title: `${d.title} ${d.name}`, author: 'Habitat for Humanity of Orange County' },
    h(Page, { size: 'LETTER', style: s.page },
      h(Text, { style: s.eyebrow }, `Habitat for Humanity of Orange County  ·  ${d.sample}`),
      h(Text, { style: s.title }, `${d.title} ${d.name}`),
      h(Text, { style: s.city }, d.city),
      h(View, { style: s.numbers },
        ...d.numbers.map((n, i) => h(View, { key: i, style: s.numCell }, h(Text, { style: s.numValue }, n.value), h(Text, { style: s.numLabel }, n.label))),
      ),
      h(View, { style: s.section },
        h(Text, { style: s.h2 }, d.keepsTitle),
        ...d.keeps.map((k, i) => h(View, { key: i, style: s.item }, h(Text, { style: s.bullet }, '•'), h(Text, { style: s.itemText }, k))),
      ),
      h(View, { style: s.section },
        h(Text, { style: s.h2 }, d.sb4Title),
        ...d.sb4.map((k, i) => h(View, { key: i, style: s.item }, h(Text, { style: s.bullet }, '•'), h(Text, { style: s.itemText }, k))),
      ),
      h(Text, { style: s.foot }, `${d.notLegal}  ·  ${d.footer}`),
    ),
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
