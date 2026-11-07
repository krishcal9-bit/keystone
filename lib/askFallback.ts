import { SB4_FACTS, NOT_LEGAL } from './sb4Facts';

export type FactId = (typeof SB4_FACTS)[number]['id'];

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'is', 'are', 'do', 'does', 'we', 'our', 'it', 'for', 'and', 'or', 'on', 'if', 'how', 'what', 'can', 'be', 'by', 'with', 'that', 'this', 'per', 'any', 'need', 'required', 'require', 'requires', 'many', 'much', 'long', 'some', 'go', 'get', 'have', 'has']);

/** Synonyms that map everyday words onto the vocabulary of the facts. */
const SYN: Record<string, string[]> = {
  church: ['religious', 'institution'], churches: ['religious'], congregation: ['religious', 'institution'], temple: ['religious'], mosque: ['religious'], synagogue: ['religious'], parish: ['religious'],
  college: ['higher', 'education', 'college'], university: ['higher', 'education', 'college'], school: ['higher', 'education'],
  bought: ['owned', '2024'], buy: ['owned', '2024'], purchased: ['owned', '2024'], acquired: ['owned', '2024'], own: ['owned'], owned: ['owned'], ownership: ['ownership', 'owned'],
  qualify: ['applies', 'owned', 'religious'], qualifies: ['applies', 'owned'], eligible: ['applies', 'owned'], eligibility: ['applies', 'owned'],
  homes: ['units'], home: ['units'], houses: ['units'], apartments: ['units', 'rental'], density: ['density', 'acre'], acre: ['acre', 'density'], acres: ['acre'],
  ceqa: ['ceqa', 'review'], environmental: ['environmental', 'ceqa'], review: ['review'], approval: ['approval', 'ministerial'], permit: ['approval', 'ministerial'], permits: ['approval'], discretionary: ['discretionary'],
  deed: ['deed', 'restriction'], restriction: ['deed', 'restriction'], affordability: ['affordability', 'deed'], affordable: ['affordability', 'lower-income'], years: ['years'],
  staff: ['staff'], employees: ['staff'], pastor: ['staff'], income: ['lower-income', 'moderate-income'], moderate: ['moderate-income'],
  height: ['height', 'story'], stories: ['story', 'height'], tall: ['height'], taller: ['height'],
  phase: ['phase', 'assessment'], study: ['assessment', 'study'], studies: ['assessment', 'study'], soil: ['phase', 'assessment'], contamination: ['phase', 'assessment'],
  habitat: ['habitat'], mortgage: ['habitat', 'mortgage'], sweat: ['habitat', 'sweat'], families: ['habitat', 'families'], volunteers: ['habitat', 'volunteers'],
  land: ['land', 'owned'], cost: ['cost', 'land'], expensive: ['cost', 'land'], money: ['cost'],
  when: ['effect', '2024'], expire: ['sunsets', '2036'], expires: ['sunsets', '2036'], sunset: ['sunsets'], deadline: ['sunsets', '2036'], start: ['effect'],
  legal: ['legal', 'counsel'], lawyer: ['legal', 'counsel'], attorney: ['legal', 'counsel'], advice: ['legal'],
  'san': ['diego', 'parcels'], diego: ['diego', 'parcels'], county: ['county'],
};

const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9%§-]+/g, ' ').split(' ').filter((w) => w && !STOP.has(w));

export function rankFacts(question: string): { id: FactId; text: string; score: number }[] {
  const q = tokens(question);
  const expanded = new Set<string>(q);
  for (const w of q) for (const s of SYN[w] ?? []) expanded.add(s);
  return SB4_FACTS.map((f) => {
    const ft = tokens(f.text);
    let score = 0;
    for (const w of expanded) {
      if (ft.some((x) => x === w || (w.length > 4 && x.startsWith(w)))) score += q.includes(w) ? 2 : 1;
    }
    return { id: f.id, text: f.text, score };
  }).filter((f) => f.id !== 'N1').sort((a, b) => b.score - a.score);
}

const LEGAL_TRIGGER = /qualif|eligib|legal|allow|can we|do we|must|requir|rule|law|deed|counsel|permit|approv|ceqa|restrict/i;

/** Keyword-matched answer composed from the two best facts. Always ends with a FACTS line. */
export function askFallback(question: string): string {
  const ranked = rankFacts(question);
  const top = ranked.filter((f) => f.score > 0).slice(0, 2);
  const legal = LEGAL_TRIGGER.test(question);
  const lines: string[] = [];
  if (!top.length) {
    lines.push('I don’t have a fact for that; confirm with the city and counsel.');
    lines.push('', `${NOT_LEGAL}`, '', 'FACTS: N1');
    return lines.join('\n');
  }
  lines.push(top.map((f) => f.text).join(' '));
  const ids = top.map((f) => f.id);
  if (legal) { lines.push('', NOT_LEGAL); ids.push('N1'); }
  lines.push('', `FACTS: ${ids.join(', ')}`);
  return lines.join('\n');
}
