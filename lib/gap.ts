/**
 * "Closes the gap": an illustrative per-home cost stack for a site, before and after the Keystone move
 * (partner land under SB 4, by-right approval). Every figure is an assumption from data/assumptions.json.
 * Source for the challenge framing: Claude Impact Lab challenge brief. Not an appraisal.
 */
import assumptions from '@/data/assumptions.json';
import type { Parcel } from './sb4';
import { A, recommendedScenario } from './sb4';

export const BRIEF = assumptions.brief;
const G = assumptions.gap;

export type Segment = { id: 'land' | 'design' | 'permits' | 'build'; label: string; value: number; note: string };
export type Stack = { segments: Segment[]; total: number };
export type GapModel = {
  homes: number;
  acres: number;
  today: Stack;
  keystone: Stack;
  family: number;
  familyIncome: number;
  familyShare: number;
  other: number;
  closes: number;
  gapToday: number;
  gapKeystone: number;
  monthsToday: number;
  monthsKeystone: number;
  monthsSaved: number;
  landMarketPerHome: number;
};

export function familyCapacity(tierShare = G.defaultTierShare.value, payShare = (BRIEF.familyPayShareMin + BRIEF.familyPayShareMax) / 2) {
  const income = G.ocMedianHouseholdIncome.value * tierShare;
  const yearly = income * payShare * (1 - G.taxesInsuranceShareOfPayment.value);
  return { income, price: Math.round(yearly * G.mortgageYears.value) };
}

const stack = (segments: Segment[]): Stack => ({ segments, total: segments.reduce((a, s) => a + s.value, 0) });

export function gapModel(parcel: Parcel, keepSpaces: number, homesOverride?: number, tierShare = G.defaultTierShare.value): GapModel {
  const s = recommendedScenario(parcel, keepSpaces);
  const homes = Math.max(1, Math.round(Number.isFinite(homesOverride ?? NaN) ? (homesOverride as number) : s.homes));
  const acres = s.buildable.acres;
  const landMarketPerHome = Math.round((acres * A.landValuePerAcre) / homes);
  const monthsToday = G.typicalMonthsLandToKeys.value, monthsKeystone = G.sb4MonthsLandToKeys.value;
  const timeToday = G.carryingCostPerHomeMonth.value * monthsToday;
  const timeKeystone = G.carryingCostPerHomeMonth.value * monthsKeystone;
  const perAcre = (A.landValuePerAcre / 1e6).toFixed(1);
  const today = stack([
    { id: 'land', label: 'Land', value: landMarketPerHome, note: 'Market land at $' + perAcre + 'M/acre spread over ' + homes + ' homes (illustrative)' },
    { id: 'design', label: 'Design', value: G.designPerHome.value, note: G.designPerHome.note },
    { id: 'permits', label: 'Permits & time', value: G.permitsPerHome.value + timeToday, note: 'Permits plus ' + monthsToday + ' months of carrying cost (illustrative)' },
    { id: 'build', label: 'Build', value: G.buildPerHome.value, note: G.buildPerHome.note },
  ]);
  const keystone = stack([
    { id: 'land', label: 'Partner land', value: G.partnerLandPerHome.value, note: 'Land on faith or college property via SB 4: partner-owned (ground lease or donation), not bought at market' },
    { id: 'design', label: 'Design', value: G.designPerHome.value, note: G.designPerHome.note },
    { id: 'permits', label: 'By-right permits', value: G.permitsPerHome.value + timeKeystone, note: 'By-right approval under SB 4, no CEQA review: ' + monthsKeystone + ' months of carrying cost (illustrative)' },
    { id: 'build', label: 'Build', value: G.buildPerHome.value, note: G.buildPerHome.note },
  ]);
  const fam = familyCapacity(tierShare);
  const other = G.otherSourcesPerHome.value;
  const closes = fam.price + other;
  return {
    homes, acres, today, keystone, family: fam.price, familyIncome: fam.income, familyShare: (BRIEF.familyPayShareMin + BRIEF.familyPayShareMax) / 2, other, closes,
    gapToday: Math.max(0, today.total - closes), gapKeystone: Math.max(0, keystone.total - closes),
    monthsToday, monthsKeystone, monthsSaved: monthsToday - monthsKeystone, landMarketPerHome,
  };
}

/** Landing "The challenge" bar: an illustrative OC home, not tied to a site. */
export const CHALLENGE_ILLUSTRATIVE = {
  today: stack([
    { id: 'land', label: 'Land', value: 420000, note: 'Illustrative' },
    { id: 'design', label: 'Design', value: 40000, note: 'Illustrative' },
    { id: 'permits', label: 'Permits & time', value: 90000, note: 'Illustrative' },
    { id: 'build', label: 'Build', value: 330000, note: 'Illustrative' },
  ]),
  keystone: stack([
    { id: 'land', label: 'Partner land', value: 30000, note: 'Illustrative' },
    { id: 'design', label: 'Design', value: 40000, note: 'Illustrative' },
    { id: 'permits', label: 'By-right permits', value: 55000, note: 'Illustrative' },
    { id: 'build', label: 'Build', value: 330000, note: 'Illustrative' },
  ]),
  family: familyCapacity().price,
  other: G.otherSourcesPerHome.value,
};

export const fmtMoney = (n: number) => (Math.abs(n) >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : '$' + Math.round(n / 1000) + 'k');
export const ILLUSTRATIVE = 'Illustrative. Real numbers vary by site.';
export const BRIEF_SOURCE = 'Source: Claude Impact Lab challenge brief';
export const HCD_SOURCE = 'Source: HCD SB 4 fact sheet';
