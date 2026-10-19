// Shapes for the yearly rules files in src/rules/<year>.json.
// Every figure carries a status and a source so the UI can show where it came from.

export type Status = 'definitief' | 'voorlopig' | 'voorstel';

export interface Sourced<T> {
  value: T;
  status: Status;
  source: string; // URL
  note?: string;
}

export interface Bracket {
  /** Upper bound of this bracket in euros; null for the last bracket. */
  upTo: number | null;
  /** Combined rate (belasting + premies volksverzekeringen), e.g. 0.3582 */
  rate: number;
}

/** Piecewise-linear credit: within [from, to) the credit is base + rate * (income - from). */
export interface CreditSegment {
  from: number;
  to: number | null;
  base: number;
  rate: number;
}

export interface YearRules {
  year: number;
  box1Brackets: Sourced<Bracket[]>;
  algemeneHeffingskorting: Sourced<CreditSegment[]>;
  arbeidskorting: Sourced<CreditSegment[]>;
  zelfstandigenaftrek: Sourced<number>;
  startersaftrek: Sourced<number>;
  urencriterium: Sourced<number>;
  mkbWinstvrijstelling: Sourced<number>;
  zvwOndernemer: Sourced<{ rate: number; maxIncome: number }>;
  zvwWerkgever: Sourced<{ rate: number; maxIncome: number }>;
  vpb: Sourced<Bracket[]>;
  box2: Sourced<Bracket[]>;
  gebruikelijkLoon: Sourced<number>;
  korOmzetgrens: Sourced<number>;
  /** Hourly-rate threshold for the low-rate employment presumption; null when not in force that year. */
  rechtsvermoedenDrempel: Sourced<number | null>;
}

export interface Usage {
  label: string;
  value: string;
  status: Status;
  source: string;
}
