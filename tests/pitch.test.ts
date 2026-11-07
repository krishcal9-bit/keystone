import { describe, it, expect } from 'vitest';
import type { Parcel, ContentLang } from '@/lib/sb4';
import { recommendedScenario, impact } from '@/lib/sb4';
import { parcels } from '@/lib/data';
import {
  pitchLetterFallback, objectionsFallback, OBJECTION_IDS, practiceTurnFallback, practiceFeedbackFallback, PRACTICE_TURNS, pitchNumbers,
} from '@/lib/pitchFallback';

const LANGS: ContentLang[] = ['en', 'es', 'vi', 'ko'];
const demo = parcels[0];
const noParking: Parcel = {
  ...demo, id: 'no-parking', displayName: 'Hillside Chapel (sample)', parkingSpaces: 0, parkingAcres: 0, parkingRects: [], openAcres: 1.2, lotAcres: 1.9,
};
const tiny: Parcel = { ...noParking, id: 'tiny', openAcres: 0, lotAcres: 0.4 };
const bad = /NaN|undefined|null|\{\w+\}|\[object/;

describe('pitchLetterFallback', () => {
  for (const lang of LANGS) {
    it(`writes a clean ${lang} letter for the demo parcel`, () => {
      const letter = pitchLetterFallback(demo, lang, 60);
      const s = recommendedScenario(demo, 60);
      const im = impact(s.homes);
      expect(letter).not.toMatch(bad);
      expect(letter).toContain(demo.displayName);
      expect(letter).toContain(demo.city);
      expect(letter).toContain(String(s.homes));
      expect(letter).toContain(String(im.people));
      expect(letter).toMatch(/Habitat for Humanity of Orange County|Hábitat para la Humanidad del Condado de Orange/);
      expect(letter.split(/\n\n/).length).toBeGreaterThanOrEqual(5);
    });
    it(`handles a zero-parking parcel in ${lang}`, () => {
      const letter = pitchLetterFallback(noParking, lang);
      expect(letter).not.toMatch(bad);
      expect(letter).toContain(noParking.displayName);
    });
    it(`handles a parcel with no buildable land in ${lang}`, () => {
      const letter = pitchLetterFallback(tiny, lang, 0);
      expect(letter).not.toMatch(bad);
    });
  }
  it('stays under 260 words in English and Spanish', () => {
    for (const lang of ['en', 'es'] as const) {
      const words = pitchLetterFallback(demo, lang, 60).split(/\s+/).filter(Boolean).length;
      expect(words).toBeLessThanOrEqual(260);
    }
  });
  it('uses engine numbers, never hardcoded ones', () => {
    const n = pitchNumbers(demo, 60);
    expect(n.keptSpaces).toBe(60);
    expect(n.homes).toBe(recommendedScenario(demo, 60).homes);
    expect(pitchNumbers(noParking).keptSpaces).toBe(0);
    expect(pitchNumbers(tiny, 0).buildableAcres).toBe('0.0');
  });
});

describe('objectionsFallback', () => {
  it('returns exactly six objections with the canonical ids in order', () => {
    const list = objectionsFallback(demo, 60);
    expect(list).toHaveLength(6);
    expect(list.map((o) => o.id)).toEqual([...OBJECTION_IDS]);
    for (const o of list) {
      expect(o.question.length).toBeGreaterThan(8);
      expect(o.answer.length).toBeGreaterThan(40);
      expect(o.answer).not.toMatch(bad);
    }
  });
  it('adapts the parking answer for lots without parking', () => {
    const list = objectionsFallback(noParking);
    expect(list[0].answer).not.toMatch(bad);
    expect(list[0].answer).toMatch(/no surface parking/i);
    expect(list.find((o) => o.id === 'control')?.answer).toMatch(/45 years/);
  });
});

describe('practice fallbacks', () => {
  it('serves board turns by count and clamps at the end', () => {
    expect(practiceTurnFallback(0)).toBe(PRACTICE_TURNS[0]);
    expect(practiceTurnFallback(3)).toBe(PRACTICE_TURNS[3]);
    expect(practiceTurnFallback(99)).toBe(PRACTICE_TURNS[PRACTICE_TURNS.length - 1]);
    expect(practiceTurnFallback(-2)).toBe(PRACTICE_TURNS[0]);
    for (const turn of PRACTICE_TURNS) expect(turn.trim().endsWith('?')).toBe(true);
  });
  it('gives feedback with both sections even for empty answers', () => {
    const fb = practiceFeedbackFallback([]);
    expect(fb).toContain('What landed');
    expect(fb).toContain('What to tighten');
    const fb2 = practiceFeedbackFallback(['We keep 60 parking spaces and count cars first.', 'SB 4 approval is ministerial.', 'Families own the homes with an affordable mortgage.', 'A ground lease keeps title with you.']);
    expect(fb2).toMatch(/parking count/i);
    expect(fb2).not.toMatch(bad);
  });
});
