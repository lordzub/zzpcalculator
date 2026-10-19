import type { YearRules } from '../engine/types';
import y2025 from './2025.json';
import y2026 from './2026.json';
import y2027 from './2027.json';

const ALL: Record<number, YearRules> = {
  2025: y2025 as YearRules,
  2026: y2026 as YearRules,
  2027: y2027 as YearRules,
};

export const YEARS = Object.keys(ALL).map(Number).sort();

/** The year tools open on. Switch on 1 January. */
export const DEFAULT_YEAR = 2026;

/** Refuses to calculate for a missing year instead of silently falling back. */
export function getRules(year: number): YearRules {
  const r = ALL[year];
  if (!r) throw new Error(`Geen regels beschikbaar voor ${year}`);
  return r;
}

/** True when any figure in the year is not yet final. */
export function hasProvisional(year: number): boolean {
  const r = getRules(year);
  return Object.values(r).some(
    (v) => typeof v === 'object' && v !== null && 'status' in v && (v as { status: string }).status !== 'definitief',
  );
}
