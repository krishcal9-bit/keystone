/** Placeholder city checklist (sample data). Real data: each city's planning portal and fee schedule. */
export type CityRule = { item: string; note: string; sample?: string };

const COMMON: CityRule[] = [
  { item: 'Pre-application meeting request', note: 'Confirms the SB 4 ministerial path and the objective standards that apply.' },
  { item: 'SB 4 eligibility letter', note: 'Ownership on or before January 1, 2024 and institution status (HCD SB 4 fact sheet).' },
  { item: 'Objective standards checklist', note: 'Height, setbacks, parking ratios, open space. One story above the local limit is allowed under SB 4.' },
  { item: 'Phase I environmental site assessment', note: 'Required by SB 4; Phase II only if warranted.' },
  { item: 'Site plan and tentative map submittal', note: 'Ministerial review against objective standards only.' },
  { item: 'Development impact fee schedule', note: 'Each city sets its own fees; affordable housing fee waivers may apply.' },
];

const BY_CITY: Record<string, { portal: string; fee: string; note: string }> = {
  'Santa Ana': { portal: 'Planning & Building Agency', fee: 'Sample: $18,400 per unit', note: 'Inclusionary housing ordinance; affordable projects may qualify for fee deferrals.' },
  'Anaheim': { portal: 'Planning & Building Department', fee: 'Sample: $21,900 per unit', note: 'Housing Element program for faith-based land; expedited affordable review.' },
  'Garden Grove': { portal: 'Community & Economic Development', fee: 'Sample: $15,200 per unit', note: 'Objective design standards adopted 2023.' },
  'Westminster': { portal: 'Community Development Department', fee: 'Sample: $14,700 per unit', note: 'Parking ratio reductions near transit.' },
  'Fullerton': { portal: 'Community & Economic Development', fee: 'Sample: $19,800 per unit', note: 'Park fee may be reduced for affordable units.' },
  'Orange': { portal: 'Community Development Department', fee: 'Sample: $20,600 per unit', note: 'Old Towne design district has additional objective standards.' },
  'Costa Mesa': { portal: 'Economic & Development Services', fee: 'Sample: $17,300 per unit', note: 'Measure Y does not apply to ministerial SB 4 projects.' },
  'Irvine': { portal: 'Community Development Department', fee: 'Sample: $26,100 per unit', note: 'Master-plan objective standards vary by planning area.' },
  'Tustin': { portal: 'Community Development Department', fee: 'Sample: $18,900 per unit', note: 'Legacy specific plan areas have their own standards.' },
  'Huntington Beach': { portal: 'Community Development Department', fee: 'Sample: $22,400 per unit', note: 'Coastal zone parcels may need a coastal development permit.' },
};

export function cityRules(city: string) {
  const c = BY_CITY[city] ?? { portal: 'Planning department', fee: 'Sample: fee schedule varies', note: 'Confirm objective standards with the city.' };
  return { city, portal: c.portal, fee: c.fee, note: c.note, checklist: COMMON, totalCities: 34 };
}
