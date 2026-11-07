/** The only SB 4 facts Claude is allowed to cite. Each has an id so answers can reference it. */
export const SB4_FACTS = [
  { id: 'F1', text: 'SB 4, the Affordable Housing on Faith and Higher Education Lands Act of 2023 (Gov. Code § 65913.16), took effect July 2, 2024 and sunsets January 1, 2036.' },
  { id: 'F2', text: 'It applies to land owned by a religious institution or an independent institution of higher education (a nonprofit college) on or before January 1, 2024.' },
  { id: 'F3', text: 'Qualifying projects receive ministerial, by-right approval with no discretionary review and no CEQA review, as long as they meet objective standards.' },
  { id: 'F4', text: 'All units must be for lower-income households, except up to 20% may be for moderate-income households and up to 5% may be for staff of the institution (manager units excluded).' },
  { id: 'F5', text: 'Affordability is secured by a deed restriction of 45 years for ownership housing and 55 years for rental housing.' },
  { id: 'F6', text: 'The minimum density in a metropolitan county such as Orange County is 30 units per acre, or 40 units per acre where the zone does not allow residential use.' },
  { id: 'F7', text: 'Projects may build one story above the local height limit.' },
  { id: 'F8', text: 'A Phase I environmental site assessment is required, and a Phase II if the Phase I warrants it.' },
  { id: 'F9', text: 'A UC San Diego study found faith-based organizations own about 3,600 acres across 1,300 parcels in San Diego County alone, enough for roughly 4,900 affordable homes if just 10% were developed.' },
  { id: 'H1', text: 'Habitat for Humanity of Orange County builds and sells homes to qualified lower-income families, who contribute sweat equity and pay an affordable mortgage; Habitat homeownership fits the 45-year ownership deed restriction.' },
  { id: 'H2', text: 'In Orange County, land cost, not families or volunteers, limits how many homes Habitat OC can deliver.' },
  { id: 'N1', text: 'Nothing here is legal advice. Eligibility must be confirmed with the city and legal counsel.' },
] as const;

export const SB4_SOURCES = [
  { label: 'HCD SB 4 fact sheet', url: 'https://www.hcd.ca.gov/planning-and-community-development/housing-open-data-tools/sb-4' },
  { label: 'UC San Diego Center for Housing Policy and Design, faith-owned land report', url: 'https://housingpolicy.ucsd.edu/' },
  { label: 'Gov. Code § 65913.16', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=65913.16.&lawCode=GOV' },
];

export const factsForPrompt = () => SB4_FACTS.map((f) => `[${f.id}] ${f.text}`).join('\n');
export const NOT_LEGAL = 'Not legal advice. Confirm with the city and counsel.';
