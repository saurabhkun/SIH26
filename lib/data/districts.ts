export const DISTRICT_DIVISIONS = [
  "Palamu",
  "North Chotanagpur",
  "South Chotanagpur",
  "Kolhan",
  "Santhal Pargana",
] as const;

export type DistrictDivision = (typeof DISTRICT_DIVISIONS)[number];

export interface District {
  name: string;
  division: DistrictDivision;
  col: number; // 1-indexed column for schematic map grid
  row: number; // 1-indexed row for schematic map grid
  headquarter?: string;
}

/**
 * All 24 administrative districts of Jharkhand mapped to a schematic grid (approx 9 cols x 5 rows)
 * representing Jharkhand's geographical layout:
 * - West: Palamu & Garhwa
 * - North-Center: North Chotanagpur (Chatra, Hazaribagh, Koderma, Giridih, Bokaro, Dhanbad, Ramgarh)
 * - East / North-East: Santhal Pargana (Deoghar, Dumka, Godda, Sahibganj, Pakur, Jamtara)
 * - Central-West / South: South Chotanagpur (Lohardaga, Ranchi, Gumla, Khunti, Simdega)
 * - South / South-East: Kolhan (West Singhbhum, Seraikela Kharsawan, East Singhbhum)
 */
export const JHARKHAND_DISTRICTS: District[] = [
  // 1. Palamu Division (3 districts)
  { name: "Garhwa", division: "Palamu", col: 1, row: 1, headquarter: "Garhwa" },
  { name: "Palamu", division: "Palamu", col: 2, row: 1, headquarter: "Medininagar (Daltonganj)" },
  { name: "Latehar", division: "Palamu", col: 2, row: 2, headquarter: "Latehar" },

  // 2. North Chotanagpur Division (7 districts)
  { name: "Chatra", division: "North Chotanagpur", col: 3, row: 1, headquarter: "Chatra" },
  { name: "Koderma", division: "North Chotanagpur", col: 4, row: 1, headquarter: "Koderma" },
  { name: "Giridih", division: "North Chotanagpur", col: 5, row: 1, headquarter: "Giridih" },
  { name: "Hazaribagh", division: "North Chotanagpur", col: 4, row: 2, headquarter: "Hazaribagh" },
  { name: "Bokaro", division: "North Chotanagpur", col: 5, row: 2, headquarter: "Bokaro Steel City" },
  { name: "Dhanbad", division: "North Chotanagpur", col: 6, row: 2, headquarter: "Dhanbad" },
  { name: "Ramgarh", division: "North Chotanagpur", col: 4, row: 3, headquarter: "Ramgarh Cantonment" },

  // 3. South Chotanagpur Division (5 districts)
  { name: "Lohardaga", division: "South Chotanagpur", col: 2, row: 3, headquarter: "Lohardaga" },
  { name: "Ranchi", division: "South Chotanagpur", col: 3, row: 3, headquarter: "Ranchi" },
  { name: "Gumla", division: "South Chotanagpur", col: 2, row: 4, headquarter: "Gumla" },
  { name: "Khunti", division: "South Chotanagpur", col: 3, row: 4, headquarter: "Khunti" },
  { name: "Simdega", division: "South Chotanagpur", col: 2, row: 5, headquarter: "Simdega" },

  // 4. Kolhan Division (3 districts)
  { name: "West Singhbhum", division: "Kolhan", col: 3, row: 5, headquarter: "Chaibasa" },
  { name: "Seraikela Kharsawan", division: "Kolhan", col: 4, row: 4, headquarter: "Seraikela" },
  { name: "East Singhbhum", division: "Kolhan", col: 5, row: 4, headquarter: "Jamshedpur" },

  // 5. Santhal Pargana Division (6 districts)
  { name: "Deoghar", division: "Santhal Pargana", col: 6, row: 1, headquarter: "Deoghar" },
  { name: "Dumka", division: "Santhal Pargana", col: 7, row: 1, headquarter: "Dumka" },
  { name: "Godda", division: "Santhal Pargana", col: 8, row: 1, headquarter: "Godda" },
  { name: "Sahibganj", division: "Santhal Pargana", col: 9, row: 1, headquarter: "Sahibganj" },
  { name: "Pakur", division: "Santhal Pargana", col: 9, row: 2, headquarter: "Pakur" },
  { name: "Jamtara", division: "Santhal Pargana", col: 7, row: 2, headquarter: "Jamtara" },
];

export const DISTRICT_NAMES = JHARKHAND_DISTRICTS.map((d) => d.name);

// Verification check helper
export function getDistrictsByDivision(division: DistrictDivision): District[] {
  return JHARKHAND_DISTRICTS.filter((d) => d.division === division);
}
